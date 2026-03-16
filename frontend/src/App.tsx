import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Map task priorities to CSS utility classes
const PRIORITY_CLASSES: Record<string, string> = {
  critical: "task-critical",
  high: "task-high",
  medium: "task-medium",
  low: "task-low",
};

export default function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [nlText, setNlText] = useState("");
  const [loading, setLoading] = useState(false);
  const columns = ["todo", "in_progress", "review", "done"];

  // Load tasks from API
  const load = async () => {
    const r = await fetch(`${API}/tasks`);
    const d = await r.json();
    setTasks(d.tasks || []);
  };

  useEffect(() => {
    load();
  }, []);

  const addTask = async () => {
    if (!nlText.trim()) return;
    setLoading(true);
    await fetch(`${API}/tasks/from-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: nlText }),
    });
    setNlText("");
    await load();
    setLoading(false);
  };

  const setStatus = async (id: string, status: string) => {
    await fetch(`${API}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const task = tasks.find((t) => t.id === draggableId);
    if (task) setStatus(task.id, destination.droppableId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden p-8">
      {/* Floating background blobs */}
      <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-60px] right-[-40px] w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">TaskFlow AI</h1>
        <p className="text-gray-500 mb-6">AI-powered task management dashboard</p>

        {/* Add task input */}
        <div className="flex gap-3 mb-8">
          <input
            className="input-field flex-1"
            placeholder='Describe task in plain English, e.g. "Review PR by tomorrow #urgent"'
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <button
            onClick={addTask}
            disabled={loading}
            className="button-primary"
          >
            {loading ? "Adding…" : "+ AI Add"}
          </button>
        </div>

        {/* Task columns */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-4 gap-6">
            {columns.map((col) => (
              <Droppable droppableId={col} key={col}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="card-shadow max-h-[75vh] overflow-y-auto"
                  >
                    <h3 className="font-semibold text-gray-600 capitalize mb-4 text-xs uppercase tracking-wide">
                      {col.replace("_", " ")} · {tasks.filter((t) => t.status === col).length}
                    </h3>
                    {tasks
                      .filter((t) => t.status === col)
                      .map((task, idx) => (
                        <Draggable key={task.id} draggableId={task.id} index={idx}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`card-shadow ${PRIORITY_CLASSES[task.priority]}`}
                            >
                              <p className="font-medium">{task.title}</p>
                              <p className="text-xs opacity-60 mt-0.5">AI score: {task.ai_priority_score}</p>
                              <select
                                className="mt-2 w-full text-xs border rounded px-2 py-1 bg-white shadow-sm"
                                value={task.status}
                                onChange={(e) => setStatus(task.id, e.target.value)}
                              >
                                {columns.map((c) => (
                                  <option key={c} value={c}>
                                    {c.replace("_", " ")}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-400 text-sm">
        TaskFlow AI • Intelligent Task Manager
      </footer>
    </div>
  );
}