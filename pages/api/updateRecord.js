import { updateRowInExcel } from '../../utils/excelWriter';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { rowNum, dateStr, issues, time, priority, description, entryType, isWeekendDay } = req.body;
  
  if (!rowNum || !dateStr || (!isWeekendDay && entryType === 'Normal' && (!issues || !time || !description))) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await updateRowInExcel(rowNum, {
      dateStr,
      issues,
      time: Number(time),
      priority: Number(priority || 1),
      description,
      entryType,
      isWeekendDay
    });
    return res.status(200).json({ success: true, message: 'Record updated successfully' });
  } catch (error) {
    console.error('Update API Error:', error);
    if (error.message === 'FILE_LOCKED') {
      return res.status(409).json({ message: 'The Excel file is currently open. Close it and try again.' });
    }
    return res.status(500).json({ message: 'Failed to update record.' });
  }
}
