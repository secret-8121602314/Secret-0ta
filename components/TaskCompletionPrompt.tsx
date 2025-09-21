import React from 'react';
import { TaskCompletionPrompt as TaskCompletionPromptType } from '../services/types';
import { taskCompletionPromptingService } from '../services/taskCompletionPromptingService';

interface TaskCompletionPromptProps {
  prompt: TaskCompletionPromptType;
  conversationId: string;
  onCompletionRecorded?: () => void;
}

export const TaskCompletionPrompt: React.FC<TaskCompletionPromptProps> = ({
  prompt,
  conversationId,
  onCompletionRecorded
}) => {
  const handleTaskCompletion = async (taskId: string, completed: boolean) => {
    // Record the completion response
    taskCompletionPromptingService.recordCompletionResponse(conversationId, taskId, completed);
    
    // Notify parent component
    onCompletionRecorded?.();
    
    console.log(`📝 Task completion recorded: ${taskId} - ${completed ? 'completed' : 'not completed'}`);
  };

  return (
    <div className="task-completion-prompt bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <h4 className="text-sm font-medium text-blue-900">{prompt.promptText}</h4>
      </div>
      
      <div className="space-y-3">
        {prompt.tasks.map((task) => (
          <div key={task.id} className="bg-white border border-blue-100 rounded-md p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-900 mb-1">{task.title}</h5>
                <p className="text-xs text-gray-600">{task.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    task.category === 'boss' ? 'bg-red-100 text-red-800' :
                    task.category === 'quest' ? 'bg-green-100 text-green-800' :
                    task.category === 'exploration' ? 'bg-blue-100 text-blue-800' :
                    task.category === 'item' ? 'bg-yellow-100 text-yellow-800' :
                    task.category === 'character' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.category}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleTaskCompletion(task.id, true)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
                >
                  ✓ Completed
                </button>
                <button
                  onClick={() => handleTaskCompletion(task.id, false)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
                >
                  ✗ Not Completed
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-blue-700">
        💡 Your responses will help me provide better suggestions in future conversations!
      </div>
    </div>
  );
};

export default TaskCompletionPrompt;
