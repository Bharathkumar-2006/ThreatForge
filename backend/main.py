import os
import tempfile
from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any

import storage
import ai
from config import PROJECTS_ROOT_DIR

app = FastAPI(
    title="ThreatForge API",
    description="Backend API for document-oriented threat modeling workspace",
    version="1.0.0"
)

# CORS Setup for dev environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class ProjectRenameRequest(BaseModel):
    new_name: str = Field(..., min_length=1, max_length=100)

class ProjectInfoUpdateRequest(BaseModel):
    name: str
    description: str
    tech_stack: str
    notes: str

class ArchitectureUpdateRequest(BaseModel):
    content: str

class ModuleCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class ModuleUpdateRequest(BaseModel):
    notes: str
    threats: List[Dict[str, Any]] = []

# Routes
@app.get("/api/projects", response_model=List[str])
def get_projects():
    try:
        return storage.list_projects()
    except storage.StorageError as se:
        raise HTTPException(status_code=500, detail=str(se))

@app.post("/api/projects", status_code=201)
def create_project(req: ProjectCreateRequest):
    try:
        return storage.create_project(req.name)
    except storage.StorageError as se:
        raise HTTPException(status_code=400, detail=str(se))

@app.put("/api/projects/{project_name}")
def rename_project(project_name: str, req: ProjectRenameRequest):
    try:
        return storage.rename_project(project_name, req.new_name)
    except storage.StorageError as se:
        raise HTTPException(status_code=400, detail=str(se))

@app.delete("/api/projects/{project_name}")
def delete_project(project_name: str):
    try:
        return storage.delete_project(project_name)
    except storage.StorageError as se:
        raise HTTPException(status_code=400, detail=str(se))

@app.get("/api/projects/{project_name}/info")
def get_project_info(project_name: str):
    try:
        return storage.get_project_info(project_name)
    except storage.StorageError as se:
        raise HTTPException(status_code=404, detail=str(se))

@app.put("/api/projects/{project_name}/info")
def update_project_info(project_name: str, req: ProjectInfoUpdateRequest):
    try:
        return storage.save_project_info(project_name, req.model_dump())
    except storage.StorageError as se:
        raise HTTPException(status_code=500, detail=str(se))

@app.get("/api/projects/{project_name}/architecture")
def get_architecture(project_name: str):
    try:
        return {"content": storage.get_architecture(project_name)}
    except storage.StorageError as se:
        raise HTTPException(status_code=404, detail=str(se))

@app.put("/api/projects/{project_name}/architecture")
def update_architecture(project_name: str, req: ArchitectureUpdateRequest):
    try:
        return storage.save_architecture(project_name, req.content)
    except storage.StorageError as se:
        raise HTTPException(status_code=500, detail=str(se))

@app.get("/api/projects/{project_name}/modules")
def get_modules(project_name: str):
    try:
        return storage.list_modules(project_name)
    except storage.StorageError as se:
        raise HTTPException(status_code=404, detail=str(se))

@app.post("/api/projects/{project_name}/modules", status_code=201)
def create_module(project_name: str, req: ModuleCreateRequest):
    try:
        # Check if already exists
        existing = storage.list_modules(project_name)
        if req.name in existing:
            raise HTTPException(status_code=400, detail=f"Module '{req.name}' already exists.")
        return storage.save_module(project_name, req.name, "", [])
    except storage.StorageError as se:
        raise HTTPException(status_code=400, detail=str(se))

@app.get("/api/projects/{project_name}/modules/{module_name}")
def get_module(project_name: str, module_name: str):
    try:
        return storage.get_module(project_name, module_name)
    except storage.StorageError as se:
        raise HTTPException(status_code=404, detail=str(se))

@app.put("/api/projects/{project_name}/modules/{module_name}")
def update_module(project_name: str, module_name: str, req: ModuleUpdateRequest):
    try:
        return storage.save_module(project_name, module_name, req.notes, req.threats)
    except storage.StorageError as se:
        raise HTTPException(status_code=500, detail=str(se))

@app.delete("/api/projects/{project_name}/modules/{module_name}")
def delete_module(project_name: str, module_name: str):
    try:
        return storage.delete_module(project_name, module_name)
    except storage.StorageError as se:
        raise HTTPException(status_code=400, detail=str(se))

@app.post("/api/projects/{project_name}/modules/{module_name}/generate-threats")
def generate_threats(project_name: str, module_name: str):
    try:
        project_info = storage.get_project_info(project_name)
        architecture = storage.get_architecture(project_name)
        module_data = storage.get_module(project_name, module_name)
        
        # Call AI endpoint
        new_threats = ai.generate_threat_model(
            project_info=project_info,
            architecture=architecture,
            module_name=module_name,
            module_notes=module_data.get("notes", "")
        )
        
        # Merge new threats with any existing ones (or replace, since generating threats evaluates the module notes again)
        # Replacing is generally better so we get a single, coherent STRIDE model based on current notes
        storage.save_module(project_name, module_name, module_data.get("notes", ""), new_threats)
        
        return {"threats": new_threats}
    except storage.StorageError as se:
        raise HTTPException(status_code=500, detail=str(se))
    except ai.AIError as ae:
        raise HTTPException(status_code=502, detail=str(ae))

@app.get("/api/projects/{project_name}/dashboard")
def get_dashboard(project_name: str):
    try:
        return storage.get_dashboard_stats(project_name)
    except storage.StorageError as se:
        raise HTTPException(status_code=500, detail=str(se))

@app.get("/api/projects/{project_name}/reports")
def get_report(project_name: str):
    try:
        # Compiles and saves txt report to Reports/Threat Report.txt, returns threats
        text_content = storage.generate_text_report(project_name)
        threats = storage.compile_report_data(project_name)
        return {
            "threats": threats,
            "text_report": text_content
        }
    except storage.StorageError as se:
        raise HTTPException(status_code=500, detail=str(se))

@app.get("/api/projects/{project_name}/reports/export/txt")
def export_txt(project_name: str):
    try:
        storage.generate_text_report(project_name)
        proj_path = storage.get_project_path(project_name)
        report_file = os.path.join(proj_path, "Reports", "Threat Report.txt")
        if not os.path.exists(report_file):
            raise HTTPException(status_code=404, detail="Text report file not found.")
        return FileResponse(
            report_file,
            media_type="text/plain",
            filename=f"{project_name}_Threat_Report.txt"
        )
    except storage.StorageError as se:
        raise HTTPException(status_code=500, detail=str(se))

@app.get("/api/projects/{project_name}/reports/export/pdf")
def export_pdf(project_name: str):
    try:
        # Generate temporary pdf file to serve
        temp_dir = tempfile.gettempdir()
        pdf_path = os.path.join(temp_dir, f"threat_report_{project_name}.pdf")
        
        storage.generate_pdf_report(project_name, pdf_path)
        
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"{project_name}_Threat_Report.pdf"
        )
    except storage.StorageError as se:
        raise HTTPException(status_code=500, detail=str(se))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
