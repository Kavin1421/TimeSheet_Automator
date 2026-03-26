import { writeRowToExcel } from '../../utils/excelWriter';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { dateStr, issues, time, priority, description, entryType, isWeekendDay } = req.body;
    
    // Basic validation
    if (!dateStr || (!isWeekendDay && entryType === 'Normal' && (!issues || !time || !description))) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await writeRowToExcel({
      dateStr,
      issues,
      time: Number(time),
      priority: Number(priority || 1),
      description,
      entryType,
      isWeekendDay
    });

    return res.status(200).json({ message: 'Record added to timesheet!' });

  } catch (error) {
    console.error('API writeToExcel error:', error);
    if (error.message === 'FILE_LOCKED' || (error.code && error.code === 'EBUSY')) {
      return res.status(409).json({ message: 'The Excel file is currently open in another program. Please close it and try again.' });
    }
    return res.status(500).json({ message: 'Failed to update Excel. Try again.', error: error.message });
  }
}
