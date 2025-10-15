#!/usr/bin/env python3
"""
Edufin Backend Server - Run Script
"""
import uvicorn
import os

if __name__ == "__main__":
    print("🚀 Starting Edufin Backend Server...")
    print("📊 API: http://localhost:8000")
    print("📚 Documentation: http://localhost:8000/docs")
    print("⚡ Health Check: http://localhost:8000/health")
    print("Press Ctrl+C to stop the server\n")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )