import { swapRowsInExcel } from '../../utils/excelWriter';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { rowNum1, rowNum2 } = req.body;

  if (!rowNum1 || !rowNum2) {
    return res.status(400).json({ message: 'Missing row numbers' });
  }

  try {
    const result = await swapRowsInExcel(rowNum1, rowNum2);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Reorder Error:', error);
    if (error.message === 'FILE_LOCKED') {
      return res.status(409).json({ message: 'The Excel file is currently open in Excel. Please close it and retry.' });
    }
    return res.status(500).json({ message: 'Failed to reorder records. Ensure Excel is closed.', error: error.message });
  }
}
