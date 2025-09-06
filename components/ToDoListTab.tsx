import React, { useState, useEffect } from 'react';
import type { DiaryTask } from '../services/otakuDiaryService';
import { taskDetectionService } from '../services/taskDetectionService';
import { unifiedUsageService } from '../services/unifiedUsageService';

interface ToDoListTabProps {
  gameId: string;
  tasks: DiaryTask[];
  onTaskUpdate: () => void;
  userTier: string;
}

type InternalTabType = 'user_created' | 'ai_suggested';

const ToDoListTab: React.FC<ToDoListTabProps> = ({ gameId, tasks, onTaskUpdate, userTier }) => {
  const [activeInternalTab, setActiveInternalTab] = useState<InternalTabType>('user_created');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<DiaryTask['category']>('quest');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<DiaryTask['category']>('quest');

  const userCreatedTasks = tasks.filter(task => task.type === 'user_created');
  const aiSuggestedTasks = tasks.filter(task => task.type === 'ai_suggested');

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    setIsSubmitting(true);
    console.log('🔍 Attempting to create task:', {
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || `Custom task: ${newTaskTitle.trim()}`,
      type: 'user_created',
      status: 'pending',
      category: newTaskCategory,
      gameId,
      priority: 'medium'
    });

    try {
      console.log('🔍 Creating task...');
      const { otakuDiaryService } = await import('../services/otakuDiaryService');
      const result = await otakuDiaryService.createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || `Custom task: ${newTaskTitle.trim()}`,
        type: 'user_created',
        status: 'pending',
        category: newTaskCategory,
        gameId,
        priority: 'medium'
      });

      console.log('✅ Task created successfully:', result);

      // Show success message
      setSuccessMessage(`Task "${newTaskTitle.trim()}" created successfully!`);
      
      // Clear form and close
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskCategory('quest');
      setIsAddingTask(false);
      
      // Refresh tasks
      console.log('🔍 Refreshing tasks...');
      onTaskUpdate();
      
      console.log('✅ Task creation complete');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('❌ Error adding task:', error);
      // Show user-friendly error message
      alert(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = async (taskId: string) => {
    if (!editTitle.trim()) return;

    try {
      const { otakuDiaryService } = await import('../services/otakuDiaryService');
      await otakuDiaryService.updateTask(gameId, taskId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory
      });

      setEditingTaskId(null);
      setEditTitle('');
      setEditDescription('');
      setEditCategory('quest');
      onTaskUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const { otakuDiaryService } = await import('../services/otakuDiaryService');
        await otakuDiaryService.deleteTask(gameId, taskId);
        onTaskUpdate();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    try {
      const { otakuDiaryService } = await import('../services/otakuDiaryService');
      await otakuDiaryService.markTaskComplete(gameId, taskId);
      onTaskUpdate();
    } catch (error) {
      console.error('Error marking task complete:', error);
    }
  };

  const handleMarkNeedHelp = async (taskId: string) => {
    try {
      const { otakuDiaryService } = await import('../services/otakuDiaryService');
      await otakuDiaryService.markTaskNeedHelp(gameId, taskId);
      onTaskUpdate();
    } catch (error) {
      console.error('Error marking task need help:', error);
    }
  };

  const handleMoveToUserCreated = async (taskId: string) => {
    try {
      const { otakuDiaryService } = await import('../services/otakuDiaryService');
      await otakuDiaryService.moveTaskToUserCreated(gameId, taskId);
      onTaskUpdate();
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  const startEditing = (task: DiaryTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditCategory(task.category);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditDescription('');
    setEditCategory('quest');
  };

  const renderTaskItem = (task: DiaryTask, isUserCreated: boolean = true) => {
    const isEditing = editingTaskId === task.id;

    if (isEditing) {
      return (
        <div key={task.id} className="p-4 bg-[#2E2E2E] rounded-lg border border-[#FFAB40]/30">
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white"
              placeholder="Task title"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white"
              placeholder="Task description"
              rows={2}
            />
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as DiaryTask['category'])}
              className="px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white"
            >
              <option value="quest">Quest</option>
              <option value="boss">Boss</option>
              <option value="exploration">Exploration</option>
              <option value="item">Item</option>
              <option value="character">Character</option>
              <option value="custom">Custom</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditTask(task.id)}
                className="px-3 py-1 bg-[#FFAB40] text-[#181818] rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={cancelEditing}
                className="px-3 py-1 bg-[#424242] text-white rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={task.id} className={`p-4 rounded-lg border ${
        task.status === 'completed' 
          ? 'bg-[#1C1C1C] border-green-500/30' 
          : task.status === 'need_help'
          ? 'bg-[#1C1C1C] border-red-500/30'
          : 'bg-[#2E2E2E] border-[#424242]/30'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`font-medium ${
                task.status === 'completed' ? 'line-through text-green-400' : 'text-white'
              }`}>
                {task.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs ${
                task.category === 'quest' ? 'bg-blue-500/20 text-blue-400' :
                task.category === 'boss' ? 'bg-red-500/20 text-red-400' :
                task.category === 'exploration' ? 'bg-green-500/20 text-green-400' :
                task.category === 'item' ? 'bg-yellow-500/20 text-yellow-400' :
                task.category === 'character' ? 'bg-purple-500/20 text-purple-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {task.category}
              </span>
            </div>
            <p className="text-sm text-[#CFCFCF] mb-3">{task.description}</p>
            
            {isUserCreated && (
              <div className="flex gap-2">
                {task.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleMarkComplete(task.id)}
                      className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => handleMarkNeedHelp(task.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30"
                    >
                      Need Help
                    </button>
                  </>
                )}
                {task.status === 'need_help' && (
                  <button
                    onClick={() => handleMarkComplete(task.id)}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30"
                  >
                    Mark Complete
                  </button>
                )}
                <button
                  onClick={() => startEditing(task)}
                  className="px-3 py-1 bg-[#424242] text-white rounded text-sm hover:bg-[#525252]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30"
                >
                  Delete
                </button>
              </div>
            )}
            
            {!isUserCreated && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleMoveToUserCreated(task.id)}
                  className="px-3 py-1 bg-[#FFAB40] text-[#181818] rounded text-sm hover:bg-[#FFB74D]"
                >
                  Add to User Created
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Main Tab Navigation - Large, Prominent Design */}
      <div className="bg-gradient-to-r from-[#0A0A0A] via-[#1C1C1C] to-[#0F0F0F] px-6 py-4 rounded-t-2xl border-b-2 border-[#E53A3A]/30 mb-8">
        <div className="flex gap-3">
        <button
          onClick={() => setActiveInternalTab('user_created')}
            className={`px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 ${
            activeInternalTab === 'user_created'
                ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white shadow-xl shadow-[#E53A3A]/40 scale-105'
                : 'bg-[#2A2A2A] text-[#CFCFCF] hover:bg-[#3A3A3A] hover:text-white hover:scale-105'
          }`}
        >
            User Tasks
        </button>
          <button
            onClick={() => {
              if (userTier === 'free') {
                // Show upgrade splash for free users
                setActiveInternalTab('ai_suggested');
              } else {
                setActiveInternalTab('ai_suggested');
              }
            }}
            className={`px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 ${
              activeInternalTab === 'ai_suggested'
                ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white shadow-xl shadow-[#E53A3A]/40 scale-105'
                : 'bg-[#2A2A2A] text-[#CFCFCF] hover:bg-[#3A3A3A] hover:text-white hover:scale-105'
            }`}
          >
            AI Tasks
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl text-green-400 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">✅</span>
              <span className="font-semibold">{successMessage}</span>
            </div>
          </div>
        )}
        
        {activeInternalTab === 'user_created' && (
          <div className="space-y-4">
            {/* Add New Task */}
            {!isAddingTask ? (
              <button
                onClick={() => setIsAddingTask(true)}
                className="w-full p-4 border-2 border-dashed border-[#424242] rounded-lg text-[#8A8A8A] hover:border-[#FFAB40] hover:text-[#FFAB40] transition-all duration-200"
              >
                + Add New Task
              </button>
            ) : (
              <div className="p-4 bg-[#2E2E2E] rounded-lg border border-[#FFAB40]/30">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white"
                    placeholder="Task title"
                  />
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white"
                    placeholder="Task description (optional)"
                    rows={2}
                  />
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as DiaryTask['category'])}
                    className="px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white"
                  >
                    <option value="quest">Quest</option>
                    <option value="boss">Boss</option>
                    <option value="exploration">Exploration</option>
                    <option value="item">Item</option>
                    <option value="character">Character</option>
                    <option value="custom">Custom</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddTask}
                      disabled={isSubmitting}
                      className={`px-3 py-1 rounded text-sm font-semibold transition-all duration-200 ${
                        isSubmitting
                          ? 'bg-[#424242] text-[#8A8A8A] cursor-not-allowed'
                          : 'bg-[#FFAB40] text-[#181818] hover:bg-[#FF8C00] hover:scale-105'
                      }`}
                    >
                      {isSubmitting ? 'Adding...' : 'Add Task'}
                    </button>
                    <button
                      onClick={() => setIsAddingTask(false)}
                      disabled={isSubmitting}
                      className={`px-3 py-1 rounded text-sm font-semibold transition-all duration-200 ${
                        isSubmitting
                          ? 'bg-[#424242] text-[#8A8A8A] cursor-not-allowed'
                          : 'bg-[#424242] text-white hover:bg-[#3A3A3A] hover:scale-105'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* User Tasks */}
            {userCreatedTasks.length === 0 ? (
              <div className="text-center py-8 text-[#8A8A8A]">
                No tasks yet. Add your first task above!
              </div>
            ) : (
              <div className="space-y-3">
                {userCreatedTasks.map(task => renderTaskItem(task, true))}
              </div>
            )}
          </div>
        )}

        {activeInternalTab === 'ai_suggested' && userTier !== 'free' && (
          <div className="space-y-4">
            {aiSuggestedTasks.length === 0 ? (
              <div className="text-center py-8 text-[#8A8A8A]">
                No AI suggested tasks yet. AI will automatically detect tasks from responses!
              </div>
            ) : (
              <div className="space-y-3">
                {aiSuggestedTasks.map(task => renderTaskItem(task, false))}
              </div>
            )}
          </div>
        )}

        {/* Free User Restriction - Beautiful Upgrade Splash */}
        {activeInternalTab === 'ai_suggested' && userTier === 'free' && (
          <div className="text-center py-8 sm:py-12">
            <div className="max-w-2xl mx-auto px-4">
              <div className="bg-gradient-to-br from-[#0A0A0A] via-[#1C1C1C] to-[#0F0F0F] border-2 border-[#E53A3A]/40 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-2xl">
                <div className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-3xl">🚀</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Unlock AI-Powered Gaming Tasks!</h3>
                <p className="text-[#CFCFCF] mb-6 text-sm sm:text-lg leading-relaxed">
                  Get personalized task suggestions, progress tracking, and intelligent insights 
                  powered by our advanced AI. Transform your gaming experience with Pro features!
                </p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div className="bg-[#2A2A2A]/50 p-3 sm:p-4 rounded-xl border border-[#E53A3A]/20">
                      <div className="text-xl sm:text-2xl mb-2">🤖</div>
                      <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">AI Task Detection</h4>
                      <p className="text-xs text-[#CFCFCF]">Automatic task suggestions from AI responses</p>
                    </div>
                    <div className="bg-[#2A2A2A]/50 p-3 sm:p-4 rounded-xl border border-[#E53A3A]/20">
                      <div className="text-xl sm:text-2xl mb-2">📊</div>
                      <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">Smart Analytics</h4>
                      <p className="text-xs text-[#CFCFCF]">Track progress with intelligent insights</p>
                    </div>
                    <div className="bg-[#2A2A2A]/50 p-3 sm:p-4 rounded-xl border border-[#E53A3A]/20 sm:col-span-2 lg:col-span-1">
                      <div className="text-xl sm:text-2xl mb-2">🎯</div>
                      <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">Personalized Goals</h4>
                      <p className="text-xs text-[#CFCFCF]">AI-generated gaming objectives</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <button className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:from-[#D98C1F] hover:to-[#E53A3A] transition-all duration-300 hover:scale-105 shadow-lg shadow-[#E53A3A]/30">
                      Upgrade to Pro
                    </button>
                    <button 
                      onClick={() => setActiveInternalTab('user_created')}
                      className="bg-[#2A2A2A] text-[#CFCFCF] px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg hover:bg-[#3A3A3A] hover:text-white transition-all duration-300"
                    >
                      Back to User Tasks
              </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToDoListTab;
