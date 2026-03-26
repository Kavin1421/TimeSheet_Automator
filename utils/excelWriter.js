import ExcelJS from 'exceljs';
import fs from 'fs';
import { format } from 'date-fns';

async function readFileWithRetry(workbook, filePath, retries = 8, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const buffer = await fs.promises.readFile(filePath);
      await workbook.xlsx.load(buffer);
      return;
    } catch (err) {
      if ((err.code === 'EBUSY' || err.code === 'EPERM') && i < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

async function writeFileWithRetry(workbook, filePath, retries = 8, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      await fs.promises.writeFile(filePath, buffer);
      return;
    } catch (err) {
      if ((err.code === 'EBUSY' || err.code === 'EPERM') && i < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

const EXCEL_PATH = process.env.EXCEL_PATH || 'C:\\Users\\u732611\\OneDrive - Finastra\\TC\\TCL-Update\\TimeSheet\\CTT-Timesheet.xlsx';

export async function writeRowToExcel({ dateStr, issues, time, priority, description, entryType, isWeekendDay }) {
  try {
    // Check if file exists
    if (!fs.existsSync(EXCEL_PATH)) {
      throw new Error(`Excel file not found at ${EXCEL_PATH}`);
    }

    const workbook = new ExcelJS.Workbook();
    
    // Use buffer-based read with retries to handle transient locks
    await readFileWithRetry(workbook, EXCEL_PATH);

    // Get "TimeSheet" worksheet
    const worksheet = workbook.getWorksheet('TimeSheet') || workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Worksheet "TimeSheet" not found in the Excel file.');
    }

    let targetRowIndex = -1;
    let nextEmptyRow = 2; // Assuming row 1 is headers

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      let rowDate = row.getCell(1).text;
      const cellVal = row.getCell(1).value;
      if (cellVal instanceof Date) {
        // Try to match the 'EEEE, d MMMM, yyyy' format exactly.
        rowDate = format(cellVal, 'EEEE, d MMMM, yyyy');
      } else if (!rowDate) {
        rowDate = String(cellVal || '');
      }

      if (rowDate.trim().toLowerCase() === dateStr.trim().toLowerCase()) {
        targetRowIndex = rowNumber;
      }

      if (row.getCell(1).value) {
        nextEmptyRow = Math.max(nextEmptyRow, rowNumber + 1);
      }
    });

    const isAppending = targetRowIndex !== -1;
    const targetRow = worksheet.getRow(isAppending ? targetRowIndex : Math.max(nextEmptyRow, 2));

    targetRow.getCell(1).value = dateStr;

    if (isWeekendDay || entryType !== 'Normal') {
       targetRow.getCell(3).value = null;
       targetRow.getCell(4).value = null;
       targetRow.getCell(5).value = null;

       let statusText = 'Holiday';
       let fgColor = 'FF92D050'; // Green

       if (!isWeekendDay) {
         if (entryType === 'Planned Leave') {
            statusText = 'Planned Leave';
            fgColor = 'FFB4C6E7'; // Light Blue
         } else if (entryType === 'Sick Leave') {
            statusText = 'Sick Leave';
            fgColor = 'FFFFFF00'; // Yellow
         }
       }

       targetRow.getCell(2).value = statusText;
       
       try {
         worksheet.mergeCells(`B${targetRow.number}:E${targetRow.number}`);
       } catch (e) {
         // Might already be merged
       }
       
       const mergedCell = targetRow.getCell(2);
       mergedCell.alignment = { horizontal: 'center', vertical: 'middle' };
       mergedCell.fill = {
         type: 'pattern',
         pattern: 'solid',
         fgColor: { argb: fgColor }
       };
       
       if (isWeekendDay) {
          targetRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } }; // Orange
       }
    } else {
       // Normal Entry
       try {
         worksheet.unMergeCells(`B${targetRow.number}:E${targetRow.number}`);
       } catch(e) {}

       if (isAppending) {
          const existingIssues = targetRow.getCell(2).text || '';
          const existingTime = parseFloat(targetRow.getCell(3).value) || 0;
          const existingDesc = targetRow.getCell(5).text || '';
          
          targetRow.getCell(2).value = existingIssues ? `${existingIssues} | ${issues}` : issues;
          targetRow.getCell(3).value = existingTime + Number(time);
          targetRow.getCell(4).value = Number(priority); 
          targetRow.getCell(5).value = existingDesc ? `${existingDesc}\n${description}` : description;
       } else {
          targetRow.getCell(2).value = issues;
          targetRow.getCell(3).value = Number(time);
          targetRow.getCell(4).value = Number(priority);
          targetRow.getCell(5).value = description;
       }
       
       if (!isAppending && targetRow.number > 2) {
         const prevRow = worksheet.getRow(targetRow.number - 1);
         for (let i = 1; i <= 5; i++) {
           if (prevRow.getCell(i).style) {
             targetRow.getCell(i).style = prevRow.getCell(i).style;
           }
         }
       }
    }

    targetRow.commit();

    // Write back to file using buffer and retry logic
    await writeFileWithRetry(workbook, EXCEL_PATH);
    return { success: true };

  } catch (error) {
    if (error.code === 'EBUSY' || error.code === 'EPERM') {
      throw new Error('FILE_LOCKED');
    }
    throw error;
  }
}

export async function readRecentExcelData(returnAll = false) {
  try {
    if (!fs.existsSync(EXCEL_PATH)) return { recentEntries: [], allEntries: [], todaysHours: 0 };

    const workbook = new ExcelJS.Workbook();
    await readFileWithRetry(workbook, EXCEL_PATH);
    const worksheet = workbook.getWorksheet('TimeSheet') || workbook.worksheets[0];

    if (!worksheet) return { recentEntries: [], allEntries: [], todaysHours: 0 };

    const entries = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers
      
      let dateVal = row.getCell(1).text;
      const cellVal = row.getCell(1).value;
      if (cellVal instanceof Date) {
        // format Date object to string
        dateVal = format(cellVal, 'EEEE, d MMMM, yyyy');
      } else if (!dateVal) {
        dateVal = String(cellVal || '');
      }

      const issuesVal = row.getCell(2).text || String(row.getCell(2).value || '');
      const timeVal = parseFloat(row.getCell(3).value) || 0;
      const priorityVal = parseFloat(row.getCell(4).value) || 1;
      const descVal = row.getCell(5).text || String(row.getCell(5).value || '');
      
      let entryType = 'Normal';
      if (issuesVal === 'Holiday') entryType = 'Holiday';
      if (issuesVal === 'Planned Leave') entryType = 'Planned Leave';
      if (issuesVal === 'Sick Leave') entryType = 'Sick Leave';
      
      if (dateVal.trim()) {
        entries.push({ 
          date: dateVal, 
          rawDate: cellVal instanceof Date ? cellVal.toISOString() : new Date().toISOString(), // Fallback
          issues: issuesVal, 
          time: timeVal, 
          priority: priorityVal,
          description: descVal,
          entryType,
          rowNum: rowNumber 
        });
      }
    });

    entries.reverse(); // Newest first based on row order
    const lastThree = entries.slice(0, 3);

    // Get today's formatted date to calculate today's hours
    // But since the format in excel is string like "Monday, 1 September, 2025" 
    // We just return recent entries and calculate today's total on client or we can just 
    // sum time for the most recent distinct date. For simplicity, we just return the most recent date's sum.
    
    let todaysHours = 0;
    if (entries.length > 0) {
      const mostRecentDate = entries[0].date;
      todaysHours = entries
        .filter(e => e.date === mostRecentDate)
        .reduce((sum, e) => sum + e.time, 0);
    }

    return { 
      recentEntries: lastThree,
      allEntries: returnAll ? entries : [],
      todaysHours,
      mostRecentDateStr: entries.length > 0 ? entries[0].date : null
    };

  } catch (error) {
    if (error.code === 'EBUSY' || error.code === 'EPERM') {
      throw new Error('FILE_LOCKED');
    }
    throw error;
  }
}

export async function deleteRowFromExcel(rowNum) {
  try {
    if (!fs.existsSync(EXCEL_PATH)) throw new Error('Excel file not found');

    const workbook = new ExcelJS.Workbook();
    await readFileWithRetry(workbook, EXCEL_PATH);
    const worksheet = workbook.getWorksheet('TimeSheet') || workbook.worksheets[0];

    if (!worksheet) throw new Error('Worksheet not found');

    // Splice removes the row completely and shifts everything below it up smoothly.
    worksheet.spliceRows(Number(rowNum), 1);

    await writeFileWithRetry(workbook, EXCEL_PATH);
    return { success: true };
  } catch (error) {
    if (error.code === 'EBUSY' || error.code === 'EPERM') {
      throw new Error('FILE_LOCKED');
    }
    throw error;
  }
}

export async function updateRowInExcel(rowNum, { dateStr, issues, time, priority, description, entryType, isWeekendDay }) {
  try {
    if (!fs.existsSync(EXCEL_PATH)) throw new Error('Excel file not found');

    const workbook = new ExcelJS.Workbook();
    await readFileWithRetry(workbook, EXCEL_PATH);
    const worksheet = workbook.getWorksheet('TimeSheet') || workbook.worksheets[0];

    if (!worksheet) throw new Error('Worksheet not found');

    const targetRow = worksheet.getRow(Number(rowNum));

    targetRow.getCell(1).value = dateStr;

    if (isWeekendDay || entryType !== 'Normal') {
       targetRow.getCell(3).value = null;
       targetRow.getCell(4).value = null;
       targetRow.getCell(5).value = null;

       let statusText = 'Holiday';
       let fgColor = 'FF92D050'; // Green

       if (!isWeekendDay) {
         if (entryType === 'Planned Leave') {
            statusText = 'Planned Leave';
            fgColor = 'FFB4C6E7'; // Light Blue
         } else if (entryType === 'Sick Leave') {
            statusText = 'Sick Leave';
            fgColor = 'FFFFFF00'; // Yellow
         }
       }

       targetRow.getCell(2).value = statusText;
       
       try {
         worksheet.mergeCells(`B${targetRow.number}:E${targetRow.number}`);
       } catch (e) {
         // Might already be merged
       }
       
       const mergedCell = targetRow.getCell(2);
       mergedCell.alignment = { horizontal: 'center', vertical: 'middle' };
       mergedCell.fill = {
         type: 'pattern',
         pattern: 'solid',
         fgColor: { argb: fgColor }
       };
       
       if (isWeekendDay) {
          targetRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } }; // Orange
       } else {
          targetRow.getCell(1).fill = { type: 'pattern', pattern: 'none' };
       }
    } else {
       // Normal Entry
       try {
         worksheet.unMergeCells(`B${targetRow.number}:E${targetRow.number}`);
       } catch(e) {}

       // Completely overwrite values for an Edit operation
       targetRow.getCell(2).value = issues;
       targetRow.getCell(3).value = Number(time);
       targetRow.getCell(4).value = Number(priority || 1);
       targetRow.getCell(5).value = description;

       // Strip colored background in case it used to be a holiday
       targetRow.getCell(1).fill = { type: 'pattern', pattern: 'none' };
       targetRow.getCell(2).fill = { type: 'pattern', pattern: 'none' };
       targetRow.getCell(2).alignment = { horizontal: 'left', vertical: 'bottom' }; // reset alignment
    }

    targetRow.commit();
    await writeFileWithRetry(workbook, EXCEL_PATH);
    return { success: true };
  } catch (error) {
    if (error.code === 'EBUSY' || error.code === 'EPERM') {
      throw new Error('FILE_LOCKED');
    }
    throw error;
  }
}
