'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export default function ProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
}: ProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-sm font-medium text-gray-500">Stap</span>
          <span className="ml-2 text-2xl font-bold text-gray-800">
            {currentStep + 1}
            <span className="text-gray-400 text-lg font-normal">/{totalSteps}</span>
          </span>
        </div>
        <div className="px-4 py-2 bg-blue-50 rounded-full">
          <span className="text-sm font-semibold text-blue-700">
            {stepLabels[currentStep]}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-0">
          {stepLabels.map((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={label}
                className="relative group"
                style={{
                  left: index === 0 ? '0' : undefined,
                  right: index === stepLabels.length - 1 ? '0' : undefined,
                }}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 flex items-center justify-center
                    ${isCompleted
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500 border-transparent'
                      : isCurrent
                        ? 'bg-white border-blue-500 shadow-lg shadow-blue-200'
                        : 'bg-gray-100 border-gray-200'
                    }`}
                >
                  {isCompleted && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {isCurrent && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>

                {/* Tooltip */}
                <div className={`absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded
                  opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10
                  ${isPending ? 'hidden sm:block' : ''}`}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
