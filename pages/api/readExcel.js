import { readRecentExcelData } from '../../utils/excelWriter';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const returnAll = req.query.all === 'true';
    const data = await readRecentExcelData(returnAll);
    return res.status(200).json(data);
  } catch (error) {
    console.error('API readExcel error:', error);
    if (error.message === 'FILE_LOCKED' || (error.code && (error.code === 'EBUSY' || error.code === 'EPERM'))) {
      return res.status(409).json({ message: 'The Excel file is currently open.', data: { recentEntries: [], allEntries: [], todaysHours: 0 } });
    }
    return res.status(500).json({ message: 'Failed to read Excel.' });
  }
}
