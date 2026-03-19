'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import axios from 'axios';
import PageHeader from '@/components/layout/PageHeader';

type Step = 1 | 2 | 3 | 4;

const taskTypes = [
  { value: 'generate', label: 'AI 生图', desc: '批量文本生图' },
  { value: 'fission', label: '图裂变', desc: '批量风格裂变' },
  { value: 'print', label: '打印图', desc: '批量生成打印文件' },
  { value: 'extract', label: '印花提取', desc: '批量提取印花' },
];

export default function NewBatchPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [taskType, setTaskType] = useState('generate');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState('');

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        setCsvData(data);
        setCsvColumns(results.meta.fields || []);
        // Auto-map common columns
        const autoMap: Record<string, string> = {};
        const fields = results.meta.fields || [];
        fields.forEach((f) => {
          const lower = f.toLowerCase();
          if (lower.includes('prompt')) autoMap[f] = 'prompt';
          else if (lower.includes('ref') || lower.includes('image')) autoMap[f] = 'referenceImageId';
          else if (lower.includes('dpi')) autoMap[f] = 'dpi';
          else if (lower.includes('width') || lower === 'w') autoMap[f] = 'imageWidth';
          else if (lower.includes('height') || lower === 'h') autoMap[f] = 'imageHeight';
          else if (lower.includes('sim')) autoMap[f] = 'similarity';
          else if (lower.includes('ratio') && lower.includes('aspect')) autoMap[f] = 'aspectRatio';
          else if (lower.includes('resolution') || lower === 'res') autoMap[f] = 'resolutionRatioId';
          else if (lower.includes('name') || lower.includes('file')) autoMap[f] = 'fileName';
        });
        setMapping(autoMap);
        setStep(3);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      // Transform CSV rows using column mapping
      const items = csvData.map((row) => {
        const mapped: Record<string, unknown> = {};
        for (const [csvCol, paramKey] of Object.entries(mapping)) {
          if (paramKey && row[csvCol] !== undefined) {
            // Auto-convert numeric fields
            if (['dpi', 'imageWidth', 'imageHeight', 'resolutionRatioId', 'aspectRatio'].includes(paramKey)) {
              mapped[paramKey] = Number(row[csvCol]) || 0;
            } else if (paramKey === 'similarity') {
              mapped[paramKey] = parseFloat(row[csvCol]) || 0.5;
            } else {
              mapped[paramKey] = row[csvCol];
            }
          }
        }
        return mapped;
      });

      await axios.post('/api/batch', {
        type: taskType,
        items,
        columnMapping: mapping,
        sourceFileName: fileName,
      });

      router.push(`/batch`);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="新建批量任务" description="通过 CSV/Excel 批量创建任务" />

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${step >= s ? 'bg-indigo-500 text-white' : 'bg-white/[0.06] text-gray-600'}
            `}>{s}</div>
            {s < 4 && <div className={`w-12 h-0.5 ${step > s ? 'bg-indigo-500' : 'bg-white/[0.06]'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose type */}
      {step === 1 && (
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">选择任务类型</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {taskTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => { setTaskType(t.value); setStep(2); }}
                className={`p-5 rounded-xl border text-left transition-all
                  ${taskType === t.value ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}
                `}
              >
                <div className="text-sm font-semibold text-white">{t.label}</div>
                <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Upload CSV */}
      {step === 2 && (
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">上传数据文件</h3>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/[0.08] hover:border-white/[0.15]'}
            `}
          >
            <input {...getInputProps()} />
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm text-gray-400">拖拽或点击上传 CSV / Excel 文件</p>
          </div>
          <button onClick={() => setStep(1)} className="btn-ghost text-xs mt-4">← 上一步</button>
        </div>
      )}

      {/* Step 3: Column Mapping */}
      {step === 3 && (
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-1">字段映射</h3>
          <p className="text-xs text-gray-500 mb-4">文件: {fileName} · {csvData.length} 行数据</p>
          <div className="space-y-3 mb-6">
            {csvColumns.map((col) => (
              <div key={col} className="flex items-center gap-4">
                <span className="w-40 text-sm text-gray-300 font-mono truncate">{col}</span>
                <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
                <select
                  value={mapping[col] || ''}
                  onChange={(e) => setMapping({ ...mapping, [col]: e.target.value })}
                  className="input-field w-48"
                >
                  <option value="">-- 忽略 --</option>
                  <option value="prompt">prompt (提示词)</option>
                  <option value="referenceImageId">referenceImageId (参考图)</option>
                  <option value="similarity">similarity (相似度)</option>
                  <option value="aspectRatio">aspectRatio (比例)</option>
                  <option value="resolutionRatioId">resolution (分辨率)</option>
                  <option value="dpi">dpi</option>
                  <option value="imageWidth">imageWidth (宽)</option>
                  <option value="imageHeight">imageHeight (高)</option>
                  <option value="fileName">fileName (文件名)</option>
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn-ghost text-xs">← 上一步</button>
            <button onClick={() => setStep(4)} className="btn-primary text-sm">下一步 →</button>
          </div>
        </div>
      )}

      {/* Step 4: Preview & Confirm */}
      {step === 4 && (
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">确认并提交</h3>
          <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500">任务类型:</span> <span className="text-white font-medium">{taskType}</span></div>
              <div><span className="text-gray-500">总条数:</span> <span className="text-white font-medium">{csvData.length}</span></div>
              <div><span className="text-gray-500">文件:</span> <span className="text-white font-medium">{fileName}</span></div>
            </div>
          </div>

          {/* Data preview */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-3 py-2 text-left text-gray-500">#</th>
                  {csvColumns.filter(c => mapping[c]).map(c => (
                    <th key={c} className="px-3 py-2 text-left text-gray-500">{mapping[c]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                    {csvColumns.filter(c => mapping[c]).map(c => (
                      <td key={c} className="px-3 py-2 text-gray-400 max-w-[200px] truncate">{row[c]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 5 && <p className="text-xs text-gray-600 mt-2 text-center">... 还有 {csvData.length - 5} 行</p>}
          </div>

          <div className="flex gap-2 items-center">
            <button onClick={() => setStep(3)} className="btn-ghost text-xs">← 上一步</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
              {submitting ? '提交中...' : `提交批量任务 (${csvData.length} 条)`}
            </button>
            {submitError && <span className="text-sm text-red-400">{submitError}</span>}
          </div>
        </div>
      )}
    </>
  );
}
