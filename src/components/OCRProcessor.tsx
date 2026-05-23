'use client';

export default function OCRProcessor({ progress }: { progress: number }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-8 mx-6 text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg font-medium mb-2">名刺を解析中...</p>
        <p className="text-gray-400 text-sm">会社名・氏名・電話番号を抽出しています</p>
        <div className="mt-4 bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs mt-2">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}
