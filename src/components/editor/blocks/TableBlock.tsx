import React, { useState } from 'react';
import { Block, TableData } from '../../../types/notebook';
import { Plus, Trash2, Columns, Rows } from 'lucide-react';

interface TableBlockProps {
  block: Block;
  onUpdate: (content: string, metadata?: any) => void;
}

export const TableBlock: React.FC<TableBlockProps> = ({ block, onUpdate }) => {
  const tableData: TableData = block.metadata?.tableData || {
    headers: ['Header 1', 'Header 2', 'Header 3'],
    rows: [
      ['Data 1', 'Data 2', 'Data 3'],
      ['Data 4', 'Data 5', 'Data 6'],
    ],
  };

  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  const updateTable = (newData: TableData) => {
    onUpdate(block.content, {
      ...block.metadata,
      tableData: newData,
    });
  };

  const handleHeaderChange = (colIdx: number, val: string) => {
    const newHeaders = [...tableData.headers];
    newHeaders[colIdx] = val;
    updateTable({ ...tableData, headers: newHeaders });
  };

  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    const newRows = tableData.rows.map((row, r) =>
      r === rowIdx ? row.map((cell, c) => (c === colIdx ? val : cell)) : row
    );
    updateTable({ ...tableData, rows: newRows });
  };

  const addColumn = () => {
    const newHeaders = [...tableData.headers, `Col ${tableData.headers.length + 1}`];
    const newRows = tableData.rows.map((row) => [...row, '']);
    updateTable({ headers: newHeaders, rows: newRows });
  };

  const deleteColumn = (colIdx: number) => {
    if (tableData.headers.length <= 1) return;
    const newHeaders = tableData.headers.filter((_, idx) => idx !== colIdx);
    const newRows = tableData.rows.map((row) => row.filter((_, idx) => idx !== colIdx));
    updateTable({ headers: newHeaders, rows: newRows });
  };

  const addRow = () => {
    const emptyRow = new Array(tableData.headers.length).fill('');
    updateTable({ ...tableData, rows: [...tableData.rows, emptyRow] });
  };

  const deleteRow = (rowIdx: number) => {
    if (tableData.rows.length <= 1) return;
    const newRows = tableData.rows.filter((_, idx) => idx !== rowIdx);
    updateTable({ ...tableData, rows: newRows });
  };

  return (
    <div className="w-full my-3 overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            {/* Table Header */}
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>
                <th className="w-8 px-2 py-2 text-center text-xs font-mono text-slate-400">#</th>
                {tableData.headers.map((header, colIdx) => (
                  <th
                    key={colIdx}
                    onMouseEnter={() => setHoverCol(colIdx)}
                    onMouseLeave={() => setHoverCol(null)}
                    className="relative px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                        className="w-full bg-transparent font-semibold border-none outline-none focus:bg-white dark:focus:bg-slate-800 rounded px-1"
                      />
                      {tableData.headers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteColumn(colIdx)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                          title="Delete column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-10 px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={addColumn}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Add column"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {tableData.rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onMouseEnter={() => setHoverRow(rowIdx)}
                  onMouseLeave={() => setHoverRow(null)}
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="w-8 px-2 py-1.5 text-center text-xs font-mono text-slate-400 select-none">
                    {hoverRow === rowIdx && tableData.rows.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => deleteRow(rowIdx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete row"
                      >
                        <Trash2 className="w-3 h-3 mx-auto" />
                      </button>
                    ) : (
                      rowIdx + 1
                    )}
                  </td>
                  {row.map((cell, colIdx) => (
                    <td key={colIdx} className="px-3 py-1.5">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                        className="w-full bg-transparent border-none outline-none focus:bg-slate-100 dark:focus:bg-slate-800 rounded px-1.5 py-0.5 text-slate-800 dark:text-slate-200 font-sans tabular-nums"
                      />
                    </td>
                  ))}
                  <td className="w-10" />
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table Footer Actions */}
          <div className="p-1.5 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 px-2 py-1 hover:bg-white dark:hover:bg-slate-800 rounded font-medium text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Row</span>
            </button>
            <div className="flex items-center gap-3 pr-2 font-mono tabular-nums text-[11px]">
              <span>{tableData.rows.length} rows</span>
              <span>·</span>
              <span>{tableData.headers.length} columns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
