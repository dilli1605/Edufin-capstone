import React, { useState, useEffect } from 'react'
import axios from 'axios'

const Education = () => {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedModule, setSelectedModule] = useState(null)

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8000/api/education/modules', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setModules(response.data)
    } catch (error) {
      console.error('Error fetching modules:', error)
      // Mock data
      setModules([
        {
          id: 1,
          title: "Introduction to Stock Markets",
          description: "Learn fundamental concepts of stock trading and market mechanics",
          level: "Beginner",
          duration: "2 hours",
          image: "📈",
          completed: false,
          content: [
            { type: "text", title: "What are Stocks?", content: "Stocks represent ownership in a company..." },
            { type: "video", title: "Market Basics", content: "Learn about how markets work" },
            { type: "quiz", title: "Knowledge Check", content: "Test your understanding" }
          ]
        },
        {
          id: 2,
          title: "Technical Analysis Fundamentals",
          description: "Master charts, indicators, and technical analysis strategies",
          level: "Intermediate",
          duration: "4 hours",
          image: "📊",
          completed: false,
          content: [
            { type: "text", title: "Chart Patterns", content: "Learn about common chart patterns..." },
            { type: "interactive", title: "Indicator Practice", content: "Practice using technical indicators" },
            { type: "quiz", title: "Technical Quiz", content: "Test your technical analysis skills" }
          ]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const completeModule = async (moduleId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`http://localhost:8000/api/education/modules/${moduleId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Update local state
      setModules(modules.map(module => 
        module.id === moduleId ? { ...module, completed: true } : module
      ))
    } catch (error) {
      console.error('Error completing module:', error)
      // Update locally anyway for demo
      setModules(modules.map(module => 
        module.id === moduleId ? { ...module, completed: true } : module
      ))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading courses...</span>
      </div>
    )
  }

  if (selectedModule) {
    return (
      <div className="fade-in">
        <button 
          onClick={() => setSelectedModule(null)}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Courses
        </button>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h1 className="text-3xl font-bold mb-4">{selectedModule.title}</h1>
          <p className="text-gray-600 mb-6">{selectedModule.description}</p>
          
          <div className="space-y-4">
            {selectedModule.content.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-700">{item.content}</p>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => completeModule(selectedModule.id)}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Mark as Completed
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Trading Education</h1>
      <p className="text-gray-600 mb-8">Learn stock market concepts and trading strategies</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map(module => (
          <div key={module.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="text-4xl mb-4">{module.image}</div>
              <h3 className="text-xl font-bold mb-2">{module.title}</h3>
              <p className="text-gray-600 mb-4">{module.description}</p>
              
              <div className="flex justify-between items-center mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  module.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                  module.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {module.level}
                </span>
                <span className="text-sm text-gray-500">{module.duration}</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedModule(module)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Start Learning
                </button>
                {module.completed && (
                  <span className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                    ✅ Completed
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Education