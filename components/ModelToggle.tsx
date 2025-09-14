import React from 'react';

interface ModelToggleProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  availableModels?: string[];
}

const ModelToggle: React.FC<ModelToggleProps> = ({ 
  currentModel, 
  onModelChange, 
  availableModels = ['gpt-3.5-turbo', 'gpt-4', 'claude-3'] 
}) => {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">
        Model:
      </label>
      <select
        value={currentModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {availableModels.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelToggle;
