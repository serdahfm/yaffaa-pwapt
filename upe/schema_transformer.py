from __future__ import annotations
from typing import Dict, Any, List
import json

def transform_ai_output_to_schema(ai_output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform AI output from type-based format to kind-based format expected by the schema.
    
    AI outputs: {"type": "text", "content": "..."}
    Expected: {"kind": "para", "text": "..."}
    """
    
    def transform_block(block: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a single block from AI format to schema format."""
        if not isinstance(block, dict):
            return block
            
        # Handle different block types
        block_type = block.get("type", "")
        
        if block_type == "text":
            # Transform text blocks to paragraph blocks
            return {
                "kind": "para",
                "text": block.get("content", block.get("text", ""))
            }
        elif block_type == "list":
            # Transform list blocks
            return {
                "kind": "list",
                "items": block.get("items", block.get("content", []))
            }
        elif block_type == "table":
            # Transform table blocks
            return {
                "kind": "table",
                "rows": block.get("rows", block.get("content", []))
            }
        elif block_type == "chart":
            # Transform chart blocks
            return {
                "kind": "chart",
                "spec": block.get("spec", block.get("content", {}))
            }
        else:
            # Default to paragraph if type is unknown
            return {
                "kind": "para",
                "text": str(block.get("content", block.get("text", "")))
            }
    
    def transform_section(section: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a section with its blocks."""
        if not isinstance(section, dict):
            return section
            
        blocks = section.get("blocks", [])
        if isinstance(blocks, list):
            transformed_blocks = [transform_block(block) for block in blocks]
        else:
            transformed_blocks = []
            
        return {
            "id": section.get("id", ""),
            "heading": section.get("heading", ""),
            "blocks": transformed_blocks
        }
    
    # Transform the main document structure
    transformed = {
        "title": ai_output.get("title", "Untitled Document"),
        "sections": []
    }
    
    sections = ai_output.get("sections", [])
    if isinstance(sections, list):
        transformed["sections"] = [transform_section(section) for section in sections]
    
    # Preserve citations if they exist
    if "citations" in ai_output:
        transformed["citations"] = ai_output["citations"]
    
    return transformed

def validate_and_fix_schema(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and fix common schema issues in AI output.
    """
    # Ensure required fields exist
    if "title" not in data:
        data["title"] = "Generated Document"
    
    if "sections" not in data:
        data["sections"] = []
    
    # Ensure sections have required fields
    for section in data["sections"]:
        if "id" not in section:
            section["id"] = f"section_{len(data['sections'])}"
        if "heading" not in section:
            section["heading"] = "Section"
        if "blocks" not in section:
            section["blocks"] = []
    
    return data
