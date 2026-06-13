import os
import shutil
from typing import Dict, List, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from config import PROJECTS_ROOT_DIR

class StorageError(Exception):
    pass

# Helper to sanitize folder/file names to prevent directory traversal
def sanitize_name(name: str) -> str:
    # Remove path separator characters
    clean = name.replace("/", "").replace("\\", "").replace("..", "").strip()
    if not clean:
        raise StorageError("Invalid name: Name cannot be empty or contain only path separators.")
    return clean

def get_project_path(project_name: str) -> str:
    clean_name = sanitize_name(project_name)
    return os.path.join(PROJECTS_ROOT_DIR, clean_name)

def list_projects() -> List[str]:
    try:
        if not os.path.exists(PROJECTS_ROOT_DIR):
            return []
        # Return directory names in Projects root
        return [
            d for d in os.listdir(PROJECTS_ROOT_DIR)
            if os.path.isdir(os.path.join(PROJECTS_ROOT_DIR, d))
        ]
    except Exception as e:
        raise StorageError(f"Failed to list projects: {str(e)}")

def create_project(project_name: str) -> Dict[str, Any]:
    try:
        path = get_project_path(project_name)
        if os.path.exists(path):
            raise StorageError(f"Project '{project_name}' already exists.")
        
        # Create directories
        os.makedirs(path, exist_ok=True)
        os.makedirs(os.path.join(path, "Modules"), exist_ok=True)
        os.makedirs(os.path.join(path, "Reports"), exist_ok=True)
        
        # Initialize Project Info.txt
        info_content = (
            f"Project Name: {project_name}\n\n"
            "Description:\n"
            "Provide a brief description of the project.\n\n"
            "Tech Stack:\n"
            "e.g., React, FastAPI, PostgreSQL\n\n"
            "Notes:\n"
            "Additional notes on authentication, deployment, security scope, etc.\n"
        )
        with open(os.path.join(path, "Project Info.txt"), "w", encoding="utf-8") as f:
            f.write(info_content)
            
        # Initialize Architecture.txt
        arch_content = (
            "Provide architecture details in plain English.\n"
            "Example:\n"
            "Users access a React frontend.\n"
            "Frontend communicates with API Gateway.\n"
            "API Gateway communicates with Authentication Service."
        )
        with open(os.path.join(path, "Architecture.txt"), "w", encoding="utf-8") as f:
            f.write(arch_content)
            
        return {"name": project_name, "status": "created"}
    except Exception as e:
        if not isinstance(e, StorageError):
            raise StorageError(f"Failed to create project: {str(e)}")
        raise e

def rename_project(old_name: str, new_name: str) -> Dict[str, Any]:
    try:
        old_path = get_project_path(old_name)
        new_path = get_project_path(new_name)
        
        if not os.path.exists(old_path):
            raise StorageError(f"Project '{old_name}' does not exist.")
        if os.path.exists(new_path) and old_path != new_path:
            raise StorageError(f"A project named '{new_name}' already exists.")
            
        shutil.move(old_path, new_path)
        
        # Update project name inside Project Info.txt
        info_file = os.path.join(new_path, "Project Info.txt")
        if os.path.exists(info_file):
            info_data = get_project_info(new_name)
            info_data["name"] = new_name
            save_project_info(new_name, info_data)
            
        return {"old_name": old_name, "new_name": new_name, "status": "renamed"}
    except Exception as e:
        if not isinstance(e, StorageError):
            raise StorageError(f"Failed to rename project: {str(e)}")
        raise e

def delete_project(project_name: str) -> Dict[str, Any]:
    try:
        path = get_project_path(project_name)
        if not os.path.exists(path):
            raise StorageError(f"Project '{project_name}' does not exist.")
        
        shutil.rmtree(path)
        return {"name": project_name, "status": "deleted"}
    except Exception as e:
        raise StorageError(f"Failed to delete project: {str(e)}")

# Project Info Parser/Serializer
def parse_project_info_text(text: str) -> Dict[str, str]:
    info = {"name": "", "description": "", "tech_stack": "", "notes": ""}
    lines = text.splitlines()
    current_key = None
    
    key_map = {
        "project name": "name",
        "description": "description",
        "tech stack": "tech_stack",
        "notes": "notes"
    }
    
    for line in lines:
        stripped = line.strip()
        lower_line = stripped.lower()
        matched = False
        for prefix, key in key_map.items():
            if lower_line.startswith(prefix + ":"):
                current_key = key
                val = stripped.split(":", 1)[1].strip()
                info[current_key] = val
                matched = True
                break
        if matched:
            continue
            
        if current_key:
            if info[current_key]:
                info[current_key] += "\n" + line
            else:
                info[current_key] = line
                
    for k in info:
        info[k] = info[k].strip()
    return info

def serialize_project_info_text(info: Dict[str, str]) -> str:
    name = info.get("name", "").strip()
    description = info.get("description", "").strip()
    tech_stack = info.get("tech_stack", "").strip()
    notes = info.get("notes", "").strip()
    
    return (
        f"Project Name: {name}\n\n"
        f"Description:\n{description}\n\n"
        f"Tech Stack:\n{tech_stack}\n\n"
        f"Notes:\n{notes}\n"
    )

def get_project_info(project_name: str) -> Dict[str, str]:
    try:
        path = get_project_path(project_name)
        info_file = os.path.join(path, "Project Info.txt")
        if not os.path.exists(info_file):
            raise StorageError(f"Project Info.txt not found for '{project_name}'.")
            
        with open(info_file, "r", encoding="utf-8") as f:
            text = f.read()
            
        return parse_project_info_text(text)
    except Exception as e:
        if not isinstance(e, StorageError):
            raise StorageError(f"Failed to read project info: {str(e)}")
        raise e

def save_project_info(project_name: str, info_data: Dict[str, str]) -> Dict[str, Any]:
    try:
        path = get_project_path(project_name)
        info_file = os.path.join(path, "Project Info.txt")
        
        # Ensure the actual project directory exists (in case user renames it, path is already created)
        os.makedirs(os.path.dirname(info_file), exist_ok=True)
        
        content = serialize_project_info_text(info_data)
        with open(info_file, "w", encoding="utf-8") as f:
            f.write(content)
            
        return {"status": "saved"}
    except Exception as e:
        raise StorageError(f"Failed to save project info: {str(e)}")

# Architecture getter/setter
def get_architecture(project_name: str) -> str:
    try:
        path = get_project_path(project_name)
        arch_file = os.path.join(path, "Architecture.txt")
        if not os.path.exists(arch_file):
            return ""
        with open(arch_file, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        raise StorageError(f"Failed to read Architecture: {str(e)}")

def save_architecture(project_name: str, content: str) -> Dict[str, Any]:
    try:
        path = get_project_path(project_name)
        arch_file = os.path.join(path, "Architecture.txt")
        with open(arch_file, "w", encoding="utf-8") as f:
            f.write(content)
        return {"status": "saved"}
    except Exception as e:
        raise StorageError(f"Failed to save Architecture: {str(e)}")

# Modules Parser/Serializer
def parse_module_text(text: str) -> Dict[str, Any]:
    lines = text.splitlines()
    name = ""
    notes_lines = []
    threats = []
    state = "idle"  # idle, notes, threat_model
    
    for line in lines:
        stripped = line.strip()
        lower_line = stripped.lower()
        
        if lower_line.startswith("module:"):
            name = stripped[len("module:"):].strip()
            continue
        elif lower_line == "notes:":
            state = "notes"
            continue
        elif lower_line == "threat model:":
            state = "threat_model"
            continue
            
        if state == "notes":
            notes_lines.append(line)
        elif state == "threat_model":
            # Skip empty lines or table header rows
            if not stripped or stripped.startswith("Threat Name|"):
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 5:
                threats.append({
                    "threat_name": parts[0],
                    "stride_category": parts[1],
                    "risk_level": parts[2],
                    "attack_scenario": parts[3],
                    "mitigation": parts[4]
                })
                
    notes = "\n".join(notes_lines).strip()
    return {
        "name": name,
        "notes": notes,
        "threats": threats
    }

def serialize_module_text(name: str, notes: str, threats: List[Dict[str, str]]) -> str:
    content = []
    content.append(f"Module: {name}\n")
    content.append("Notes:")
    content.append(notes.strip() + "\n")
    
    if threats:
        content.append("Threat Model:")
        content.append("Threat Name|STRIDE|Risk|Attack Scenario|Mitigation")
        for t in threats:
            t_name = str(t.get("threat_name", "")).replace("|", "/")
            stride = str(t.get("stride_category", "")).replace("|", "/")
            risk = str(t.get("risk_level", "")).replace("|", "/")
            scenario = str(t.get("attack_scenario", "")).replace("|", "/")
            mitigation = str(t.get("mitigation", "")).replace("|", "/")
            
            content.append(f"{t_name}|{stride}|{risk}|{scenario}|{mitigation}")
            
    return "\n".join(content)

def list_modules(project_name: str) -> List[str]:
    try:
        path = get_project_path(project_name)
        modules_dir = os.path.join(path, "Modules")
        if not os.path.exists(modules_dir):
            return []
        
        # List all txt files
        files = os.listdir(modules_dir)
        return [
            os.path.splitext(f)[0] for f in files 
            if f.endswith(".txt") and os.path.isfile(os.path.join(modules_dir, f))
        ]
    except Exception as e:
        raise StorageError(f"Failed to list modules: {str(e)}")

def get_module(project_name: str, module_name: str) -> Dict[str, Any]:
    try:
        path = get_project_path(project_name)
        clean_mod = sanitize_name(module_name)
        mod_file = os.path.join(path, "Modules", f"{clean_mod}.txt")
        
        if not os.path.exists(mod_file):
            raise StorageError(f"Module '{module_name}' does not exist.")
            
        with open(mod_file, "r", encoding="utf-8") as f:
            text = f.read()
            
        result = parse_module_text(text)
        # Ensure module name matches the filename in case it wasn't specified inside
        if not result["name"]:
            result["name"] = module_name
        return result
    except Exception as e:
        if not isinstance(e, StorageError):
            raise StorageError(f"Failed to read module: {str(e)}")
        raise e

def save_module(project_name: str, module_name: str, notes: str, threats: List[Dict[str, str]]) -> Dict[str, Any]:
    try:
        path = get_project_path(project_name)
        clean_mod = sanitize_name(module_name)
        modules_dir = os.path.join(path, "Modules")
        os.makedirs(modules_dir, exist_ok=True)
        
        mod_file = os.path.join(modules_dir, f"{clean_mod}.txt")
        content = serialize_module_text(module_name, notes, threats)
        
        with open(mod_file, "w", encoding="utf-8") as f:
            f.write(content)
            
        return {"name": module_name, "status": "saved"}
    except Exception as e:
        raise StorageError(f"Failed to save module: {str(e)}")

def delete_module(project_name: str, module_name: str) -> Dict[str, Any]:
    try:
        path = get_project_path(project_name)
        clean_mod = sanitize_name(module_name)
        mod_file = os.path.join(path, "Modules", f"{clean_mod}.txt")
        
        if not os.path.exists(mod_file):
            raise StorageError(f"Module '{module_name}' does not exist.")
            
        os.remove(mod_file)
        return {"name": module_name, "status": "deleted"}
    except Exception as e:
        raise StorageError(f"Failed to delete module: {str(e)}")

# Dashboard stats
def get_dashboard_stats(project_name: str) -> Dict[str, Any]:
    try:
        modules = list_modules(project_name)
        total_threats = 0
        risk_counts = {
            "Critical": 0,
            "High": 0,
            "Medium": 0,
            "Low": 0
        }
        
        for mod in modules:
            mod_data = get_module(project_name, mod)
            threats = mod_data.get("threats", [])
            total_threats += len(threats)
            
            for t in threats:
                risk = t.get("risk_level", "").strip().capitalize()
                if risk in risk_counts:
                    risk_counts[risk] += 1
                else:
                    # Map other variants or fallback
                    if "crit" in risk.lower():
                        risk_counts["Critical"] += 1
                    elif "high" in risk.lower():
                        risk_counts["High"] += 1
                    elif "med" in risk.lower():
                        risk_counts["Medium"] += 1
                    elif "low" in risk.lower():
                        risk_counts["Low"] += 1
                    else:
                        # Default to Medium if not specified
                        risk_counts["Medium"] += 1
                        
        return {
            "total_modules": len(modules),
            "total_threats": total_threats,
            "risk_counts": risk_counts
        }
    except Exception as e:
        raise StorageError(f"Failed to get dashboard stats: {str(e)}")

# Compile reports
def compile_report_data(project_name: str) -> List[Dict[str, Any]]:
    try:
        modules = list_modules(project_name)
        all_threats = []
        for mod in modules:
            mod_data = get_module(project_name, mod)
            for t in mod_data.get("threats", []):
                all_threats.append({
                    "module_name": mod,
                    "threat_name": t.get("threat_name", ""),
                    "stride_category": t.get("stride_category", ""),
                    "risk_level": t.get("risk_level", ""),
                    "attack_scenario": t.get("attack_scenario", ""),
                    "mitigation": t.get("mitigation", "")
                })
        return all_threats
    except Exception as e:
        raise StorageError(f"Failed to compile report: {str(e)}")

def generate_text_report(project_name: str) -> str:
    try:
        path = get_project_path(project_name)
        info = get_project_info(project_name)
        report_data = compile_report_data(project_name)
        
        lines = []
        lines.append(f"============================================================")
        lines.append(f"THREAT MODELING REPORT: {info.get('name', project_name)}")
        lines.append(f"============================================================")
        lines.append(f"Description: {info.get('description', '')}\n")
        lines.append(f"Tech Stack: {info.get('tech_stack', '')}\n")
        lines.append(f"Notes: {info.get('notes', '')}\n")
        lines.append(f"============================================================")
        lines.append(f"Threats Summary ({len(report_data)} threats identified):")
        lines.append(f"============================================================")
        
        current_module = None
        for t in report_data:
            if t["module_name"] != current_module:
                current_module = t["module_name"]
                lines.append(f"\nModule: {current_module}")
                lines.append("-" * 40)
            
            lines.append(f"Threat Name: {t['threat_name']}")
            lines.append(f"STRIDE:      {t['stride_category']}")
            lines.append(f"Risk Level:  {t['risk_level']}")
            lines.append(f"Scenario:    {t['attack_scenario']}")
            lines.append(f"Mitigation:  {t['mitigation']}")
            lines.append("")
            
        content = "\n".join(lines)
        
        # Write to local file
        reports_dir = os.path.join(path, "Reports")
        os.makedirs(reports_dir, exist_ok=True)
        report_file = os.path.join(reports_dir, "Threat Report.txt")
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(content)
            
        return content
    except Exception as e:
        raise StorageError(f"Failed to generate text report: {str(e)}")

def generate_pdf_report(project_name: str, output_path: str):
    try:
        info = get_project_info(project_name)
        report_data = compile_report_data(project_name)
        
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=54,
            bottomMargin=54
        )
        
        styles = getSampleStyleSheet()
        
        # Create custom styles
        title_style = ParagraphStyle(
            name="ReportTitle",
            parent=styles["Title"],
            fontSize=24,
            leading=28,
            textColor=colors.HexColor("#1e293b"),
            alignment=TA_LEFT,
            spaceAfter=15
        )
        
        h1_style = ParagraphStyle(
            name="Heading1Custom",
            parent=styles["Heading1"],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=15,
            spaceAfter=8,
            keepWithNext=True
        )
        
        h2_style = ParagraphStyle(
            name="Heading2Custom",
            parent=styles["Heading2"],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#334155"),
            spaceBefore=12,
            spaceAfter=6,
            keepWithNext=True
        )

        body_style = ParagraphStyle(
            name="BodyCustom",
            parent=styles["BodyText"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#334155"),
            spaceAfter=6
        )

        table_header_style = ParagraphStyle(
            name="TableHeader",
            parent=styles["Normal"],
            fontSize=9,
            leading=11,
            textColor=colors.white,
            fontName="Helvetica-Bold"
        )
        
        table_body_style = ParagraphStyle(
            name="TableBody",
            parent=styles["Normal"],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#1e293b")
        )
        
        story = []
        
        # Title
        story.append(Paragraph(f"ThreatForge Security Report", title_style))
        story.append(Paragraph(f"<b>Project:</b> {info.get('name', project_name)}", h2_style))
        story.append(Spacer(1, 10))
        
        # Project Info Details
        story.append(Paragraph("Project Metadata", h1_style))
        story.append(Paragraph(f"<b>Description:</b> {info.get('description', '')}", body_style))
        story.append(Paragraph(f"<b>Tech Stack:</b> {info.get('tech_stack', '')}", body_style))
        story.append(Paragraph(f"<b>Notes:</b> {info.get('notes', '')}", body_style))
        story.append(Spacer(1, 15))
        
        # Group threats by module
        modules = {}
        for t in report_data:
            mod = t["module_name"]
            if mod not in modules:
                modules[mod] = []
            modules[mod].append(t)
            
        story.append(Paragraph("Threat Modeling Results", h1_style))
        
        if not modules:
            story.append(Paragraph("No threats identified or no modules created yet.", body_style))
        else:
            for mod_name, threats in modules.items():
                story.append(Paragraph(f"Module: {mod_name}", h2_style))
                
                # Setup Table
                # Columns: Threat Name, STRIDE, Risk, Attack Scenario, Mitigation
                # Total width available on Letter is ~504 pt (612 - 108 margin)
                # Column widths: 90, 60, 50, 154, 150
                col_widths = [90, 60, 50, 154, 150]
                
                table_data = [
                    [
                        Paragraph("Threat Name", table_header_style),
                        Paragraph("STRIDE", table_header_style),
                        Paragraph("Risk", table_header_style),
                        Paragraph("Attack Scenario", table_header_style),
                        Paragraph("Mitigation", table_header_style)
                    ]
                ]
                
                for t in threats:
                    risk = t.get("risk_level", "")
                    
                    # Style risk background slightly if possible, or just print
                    table_data.append([
                        Paragraph(t.get("threat_name", ""), table_body_style),
                        Paragraph(t.get("stride_category", ""), table_body_style),
                        Paragraph(f"<b>{risk}</b>", table_body_style),
                        Paragraph(t.get("attack_scenario", ""), table_body_style),
                        Paragraph(t.get("mitigation", ""), table_body_style),
                    ])
                
                # Build ReportLab Table
                t_table = Table(table_data, colWidths=col_widths, repeatRows=1)
                
                # Style Table
                t_style = TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e293b")),
                    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                    ('TOPPADDING', (0,0), (-1,-1), 6),
                    ('LEFTPADDING', (0,0), (-1,-1), 6),
                    ('RIGHTPADDING', (0,0), (-1,-1), 6),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
                ])
                
                # Add alternating backgrounds for rows
                for i in range(1, len(table_data)):
                    bg_color = colors.HexColor("#f8fafc") if i % 2 == 1 else colors.white
                    t_style.add('BACKGROUND', (0, i), (-1, i), bg_color)
                    
                t_table.setStyle(t_style)
                story.append(t_table)
                story.append(Spacer(1, 15))
                
        doc.build(story)
    except Exception as e:
        raise StorageError(f"Failed to generate PDF report: {str(e)}")
