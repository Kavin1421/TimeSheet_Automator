import { deleteRowFromExcel } from '../../utils/excelWriter';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { rowNum } = req.body;
  if (!rowNum) {
    return res.status(400).json({ message: 'Row number is required' });
  }

  try {
    await deleteRowFromExcel(rowNum);
    return res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete API Error:', error);
    if (error.message === 'FILE_LOCKED') {
      return res.status(409).json({ message: 'The Excel file is currently open. Close it and try again.' });
    }
    return res.status(500).json({ message: 'Failed to delete record.' });
  }
}
