import { readRecentExcelData } from '../../utils/excelWriter';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { parse, format, endOfMonth, eachDayOfInterval, isValid } from 'date-fns';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { month, year } = req.body;

    if (!month || !year) {
        return res.status(400).json({ message: 'Month and Year required' });
    }

    try {
        const { allEntries } = await readRecentExcelData(true);

        const targetMonth = parseInt(month, 10);
        const targetYear = parseInt(year, 10);

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = endOfMonth(startDate);
        const allDaysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

        // Precise date lookup processing
        const entriesMap = {};
        allEntries.forEach(entry => {
            let parsedResult;
            try {
                parsedResult = new Date(entry.date);
                if (isNaN(parsedResult.getTime())) {
                    // Fallback format parsing
                    parsedResult = parse(entry.date, 'EEEE, d MMMM, yyyy', new Date());
                }
            } catch (e) {
                parsedResult = new Date(entry.rawDate);
            }

            if (parsedResult && !isNaN(parsedResult.getTime())) {
                const formatKey = format(parsedResult, 'yyyy-MM-dd');
                // Retain earliest mapped entry or assume unique assignment
                if (!entriesMap[formatKey]) {
                    entriesMap[formatKey] = entry;
                }
            }
        });

        const EXPORT_DIR = process.env.EXPORT_PATH || path.join(process.cwd(), 'exports');
        if (!fs.existsSync(EXPORT_DIR)) {
            fs.mkdirSync(EXPORT_DIR, { recursive: true });
        }

        const monthShort = format(startDate, 'MMM');
        const fileName = `Kavinkumar_K_${monthShort}_${targetYear}.xlsx`;
        const fullExportPath = path.join(EXPORT_DIR, fileName);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Billing', {
            views: [{ showGridLines: false }]
        });

        // Formatting rules definition
        sheet.columns = [
            { width: 3 },  // A (padding)
            { width: 10 }, // B: RecNum
            { width: 20 }, // C: Date (mm/dd/yyyy)
            { width: 12 }, // D: From
            { width: 12 }, // E: To
            { width: 15 }, // F: Accounted
            { width: 15 }, // G: Target
            { width: 15 }, // H: Deficit
            { width: 12 }, // I: Notes
            { width: 12 }, // J: Notes
            { width: 12 }, // K: Notes/Month
            { width: 12 }  // L: Notes/Year
        ];

        const fontBold = { bold: true };
        const fontRed = { color: { argb: 'FFFF0000' } };
        const fontWhiteBold = { bold: true, color: { argb: 'FFFFFFFF' } };

        const fillBlue = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        const fillLightCyan = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        const fillGreen = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };

        const borderAll = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        const alignCenter = { vertical: 'middle', horizontal: 'center', wrapText: true };

        // Row 1
        sheet.mergeCells('B1:L1');
        const titleCell = sheet.getCell('B1');
        titleCell.value = 'BILLING FORM';
        titleCell.fill = fillBlue;
        titleCell.font = fontWhiteBold;
        titleCell.alignment = alignCenter;

        // Row 3
        const r3 = sheet.getRow(3);
        sheet.mergeCells('B3:C3');
        sheet.mergeCells('D3:E3');
        sheet.mergeCells('F3:H3');

        const personalHeadersMap = [
            { col: 2, val: 'Resource First Name' },
            { col: 4, val: 'Middle Name' },
            { col: 6, val: 'Last Name' },
            { col: 11, val: 'MONTH' },
            { col: 12, val: 'YEAR' }
        ];

        personalHeadersMap.forEach(h => {
            const cell = r3.getCell(h.col);
            cell.value = h.val;
            cell.fill = fillLightCyan;
            cell.font = fontBold;
            cell.alignment = alignCenter;
        });

        // Row 4
        const r4 = sheet.getRow(4);
        sheet.mergeCells('B4:C4');
        sheet.mergeCells('D4:E4');
        sheet.mergeCells('F4:H4');

        const personalValuesMap = [
            { col: 2, val: 'Kavinkumar' },
            { col: 4, val: '' },
            { col: 6, val: 'K' },
            { col: 11, val: monthShort },
            { col: 12, val: targetYear }
        ];
        personalValuesMap.forEach(h => {
            const cell = r4.getCell(h.col);
            cell.value = h.val;
            cell.fill = fillGreen;
            cell.alignment = alignCenter;
        });

        ['B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'K3', 'L3',
            'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'K4', 'L4'].forEach(id => {
                sheet.getCell(id).border = borderAll;
            });

        // Row 5 & 6
        sheet.mergeCells('B5:C5');
        sheet.getCell('B5').value = 'Rate per day:';
        sheet.mergeCells('D5:E5');
        sheet.getCell('D5').value = 'USD 0.00';

        sheet.mergeCells('F5:G5');
        sheet.getCell('F5').value = 'Worked days:';
        const workedDaysCell = sheet.getCell('H5');

        sheet.mergeCells('B6:C6');
        sheet.getCell('B6').value = 'Total Amount:';
        sheet.mergeCells('D6:E6');
        sheet.getCell('D6').value = 'USD 0.00';

        ['B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5',
            'B6', 'C6', 'D6', 'E6'].forEach(id => {
                sheet.getCell(id).border = borderAll;
                sheet.getCell(id).alignment = alignCenter;
                if (id.startsWith('B') || id.startsWith('F')) {
                    sheet.getCell(id).fill = fillLightCyan;
                    sheet.getCell(id).font = fontBold;
                }
                if (id.startsWith('D') || id.startsWith('H')) {
                    sheet.getCell(id).fill = fillGreen;
                }
            });

        // Row 8 Header Row
        const r8 = sheet.getRow(8);
        r8.height = 30;
        sheet.mergeCells('I8:L8');

        const tableHeaders = [
            { col: 2, val: 'RecNum' },
            { col: 3, val: 'Date\n(mm/dd/yyyy)' },
            { col: 4, val: 'From' },
            { col: 5, val: 'To' },
            { col: 6, val: 'Accounted\nno of hours' },
            { col: 7, val: 'Target no.\nof hours' },
            { col: 8, val: '(Deficit)/Extr\na\nhrs' },
            { col: 9, val: 'Notes' }
        ];

        tableHeaders.forEach(th => {
            const cell = r8.getCell(th.col);
            cell.value = th.val;
            cell.alignment = alignCenter;
            cell.font = fontBold;
            if (th.col === 8) { cell.font = { bold: true, color: { argb: 'FFFF0000' } }; }
        });

        ['B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8', 'L8'].forEach(id => {
            sheet.getCell(id).border = borderAll;
        });

        let currentExcelRow = 9;
        let recNum = 1;
        let workedDaysCounter = 0;

        let sumAccounted = 0;
        let sumTarget = 0;

        for (const d of allDaysInMonth) {
            const dayKey = format(d, 'yyyy-MM-dd');
            const dFormat = format(d, 'dd-MM-yyyy');

            let targetHours = 8;
            let accountedHours = 0;
            let fromStr = '09:30';
            let toStr = '19:30';
            let isLeave = false;
            let isRed = false;
            let notesText = '';

            const dbEntry = entriesMap[dayKey];
            const dayOfWeek = d.getDay();
            const isWeekendFlag = (dayOfWeek === 0 || dayOfWeek === 6);

            if (!dbEntry && isWeekendFlag) {
                continue; // Safe omit logs for weekend natively
            }

            if (dbEntry) {
                if (dbEntry.entryType === 'Normal') {
                    targetHours = isWeekendFlag ? 0 : 8;
                    accountedHours = Number(dbEntry.time) || 0; // Strict parse mapping
                    notesText = process.env.PROJECT_NOTES || dbEntry.description || dbEntry.issues || '';
                    if (accountedHours > 0) {
                        workedDaysCounter++;
                        const finalDecimal = 9.5 + accountedHours + 2;
                        const h = Math.floor(finalDecimal);
                        const m = Math.round((finalDecimal - h) * 60);
                        toStr = `${h.toString().padStart(2, '0')}:${m === 0 ? '00' : m.toString().padStart(2, '0')}`;
                    } else if (!isWeekendFlag) {
                        targetHours = 8;
                    }
                } else if (dbEntry.entryType === 'Sick Leave' || dbEntry.entryType === 'Planned Leave') {
                    targetHours = 0;
                    accountedHours = 0;
                    fromStr = '00:00';
                    toStr = '00:00';
                    isRed = true;
                    notesText = dbEntry.entryType;
                    isLeave = true;
                } else if (dbEntry.entryType === 'Holiday') {
                    if (Number(dbEntry.time) === 0 || !dbEntry.time) {
                        continue;
                    } else {
                        targetHours = 0;
                        accountedHours = Number(dbEntry.time);
                        notesText = process.env.PROJECT_NOTES || dbEntry.description || dbEntry.issues || 'Worked on Holiday';
                        workedDaysCounter++;

                        const finalDecimal = 9.5 + accountedHours + 2;
                        const h = Math.floor(finalDecimal);
                        const m = Math.round((finalDecimal - h) * 60);
                        toStr = `${h.toString().padStart(2, '0')}:${m === 0 ? '00' : m.toString().padStart(2, '0')}`;
                    }
                }
            } else {
                targetHours = 8;
                accountedHours = 0;
                fromStr = '';
                toStr = '';
                notesText = 'No entry logged';
            }

            const deficit = accountedHours - targetHours;
            sumAccounted += accountedHours;
            sumTarget += targetHours;

            const row = sheet.getRow(currentExcelRow);
            sheet.mergeCells(`I${currentExcelRow}:L${currentExcelRow}`);

            const rowData = [
                null,
                recNum,
                dFormat,
                fromStr,
                toStr,
                accountedHours.toFixed(2),
                targetHours.toFixed(2),
                deficit.toFixed(2),
                notesText,
            ];

            rowData.forEach((val, index) => {
                if (val === null) return;
                const colNum = index + 1;
                const cell = row.getCell(colNum);
                cell.value = (colNum >= 6 && colNum <= 8) ? Number(val) : val;
                cell.alignment = { vertical: 'middle', horizontal: 'center' };

                if (colNum === 9) {
                    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                }
                if (isRed || colNum === 8) {
                    cell.font = fontRed;
                }
                if (colNum >= 6 && colNum <= 8) {
                    cell.numFmt = '0.00';
                }
            });

            ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(c => {
                sheet.getCell(`${c}${currentExcelRow}`).border = borderAll;
            });

            if (isLeave) {
                sheet.getCell(`C${currentExcelRow}`).font = fontRed;
                sheet.getCell(`I${currentExcelRow}`).alignment = { horizontal: 'center' };
            }

            currentExcelRow++;
            recNum++;
        }

        workedDaysCell.value = workedDaysCounter;

        // Totals execution (Mirrors your precise layout requirements mapping exactly to the supplied screenshot)
        const tRow1 = sheet.getRow(currentExcelRow);
        const tRow2 = sheet.getRow(currentExcelRow + 1);

        // Row 29
        sheet.mergeCells(`B${currentExcelRow}:C${currentExcelRow}`);
        tRow1.getCell(2).value = 'TOTAL\n(Target)';
        tRow1.getCell(2).font = { bold: true, color: { argb: 'FFFF0000' } };
        tRow1.getCell(2).alignment = alignCenter;

        tRow1.getCell(4).value = Number(sumTarget.toFixed(2));
        tRow1.getCell(4).font = { bold: true, color: { argb: 'FFFF0000' } };
        tRow1.getCell(4).alignment = alignCenter;
        tRow1.getCell(4).numFmt = '0.00';

        tRow1.getCell(5).value = 'hrs';
        tRow1.getCell(5).font = { bold: true, color: { argb: 'FFFF0000' } };
        tRow1.getCell(5).alignment = alignCenter;

        tRow1.getCell(6).value = 0;
        tRow1.getCell(6).font = { bold: true, color: { argb: 'FFFF0000' } };
        tRow1.getCell(6).alignment = alignCenter;

        tRow1.getCell(7).value = 'mins or';
        tRow1.getCell(7).font = { bold: true, color: { argb: 'FFFF0000' } };
        tRow1.getCell(7).alignment = alignCenter;

        tRow1.getCell(8).value = Number(sumTarget.toFixed(2));
        tRow1.getCell(8).font = { bold: true, color: { argb: 'FFFF0000' } };
        tRow1.getCell(8).alignment = alignCenter;
        tRow1.getCell(8).numFmt = '0.00';

        tRow1.getCell(9).value = Number((sumAccounted - sumTarget).toFixed(2));
        tRow1.getCell(9).font = { bold: true, color: { argb: 'FFFF0000' } };
        tRow1.getCell(9).alignment = alignCenter;
        tRow1.getCell(9).numFmt = '0.00';

        ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => {
            tRow1.getCell(`${c}`).border = borderAll;
        });

        // Row 30
        sheet.mergeCells(`B${currentExcelRow + 1}:C${currentExcelRow + 1}`);
        tRow2.getCell(2).value = 'TOTAL\n(Accounted)';
        tRow2.getCell(2).font = { bold: true, color: { argb: 'FFFF0000' } };
        tRow2.getCell(2).alignment = alignCenter;

        tRow2.getCell(4).value = Number(sumAccounted.toFixed(2));
        tRow2.getCell(4).font = { bold: true, color: { argb: 'FFFF0000' } };
        tRow2.getCell(4).alignment = alignCenter;
        tRow2.getCell(4).numFmt = '0.00';

        tRow2.getCell(5).value = 'hrs';
        tRow2.getCell(5).font = { bold: true, color: { argb: 'FFFF0000' } };
        tRow2.getCell(5).alignment = alignCenter;

        tRow2.getCell(6).value = Number(sumAccounted.toFixed(2));
        tRow2.getCell(6).font = { bold: true, color: { argb: 'FFFF0000' } };
        tRow2.getCell(6).alignment = alignCenter;
        tRow2.getCell(6).numFmt = '0.00';

        ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(c => {
            tRow2.getCell(`${c}`).border = borderAll;
        });

        // Signatures
        currentExcelRow += 4;
        const sigRow = sheet.getRow(currentExcelRow);
        const sigRow2 = sheet.getRow(currentExcelRow + 1);

        sigRow.getCell(2).value = 'Name';
        sheet.mergeCells(`C${currentExcelRow}:E${currentExcelRow}`);
        sigRow.getCell(3).value = 'Kavinkumar K';

        sigRow2.getCell(2).value = 'Consultant';
        sheet.mergeCells(`C${currentExcelRow + 1}:E${currentExcelRow + 1}`);
        sigRow2.getCell(3).value = 'Technical Consultant';

        sigRow.getCell(6).value = 'Manager Name';
        sheet.mergeCells(`F${currentExcelRow}:H${currentExcelRow}`);
        
        sigRow.getCell(9).value = 'Satish CS';
        sheet.mergeCells(`I${currentExcelRow}:K${currentExcelRow}`);

        ['B', 'C', 'D', 'E'].forEach(c => {
            sigRow.getCell(c).fill = fillLightCyan;
            sigRow.getCell(c).border = borderAll;
            sigRow2.getCell(c).fill = fillLightCyan;
            sigRow2.getCell(c).border = borderAll;
        });
        ['F', 'G', 'H', 'I', 'J', 'K'].forEach(c => {
            sigRow.getCell(c).fill = fillLightCyan;
            sigRow.getCell(c).border = borderAll;
        });

        await workbook.xlsx.writeFile(fullExportPath);

        return res.status(200).json({ success: true, path: fullExportPath });

    } catch (error) {
        console.error('Export Manager Error:', error);
        return res.status(500).json({ message: 'Failed to generate billing sheet.', error: error.message });
    }
}
