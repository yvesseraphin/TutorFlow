from backend.services.ai_learner import (
    KNOWLEDGE_GRAPH,
    find_topic_node,
    record_mastery_attempt,
)
from backend.services.diagnostic_engine import generate_diagnostic_questions
from backend.services.lesson_planner import generate_personalized_lesson_plan
from backend.routers.live_tutor import get_live_tools
from backend.routers.tutor import get_materials


def test_knowledge_graph_structure():
    assert len(KNOWLEDGE_GRAPH) >= 10
    node = find_topic_node("Linear Equations")
    assert node is not None
    assert "Linear Equations" in node["name"]
    assert "prerequisites" in node

    # Test alias matching
    node_pemdas = find_topic_node("pemdas")
    assert node_pemdas is not None
    assert node_pemdas["name"] == "Order of Operations (PEMDAS)"


def test_diagnostic_questions_generation():
    questions = generate_diagnostic_questions(subject="Mathematics", target_topic="Linear Equations (Two-Step & Multi-Step)")
    assert len(questions) >= 3
    for q in questions:
        assert "question" in q
        assert "options" in q
        assert "correct_answer" in q
        assert "prerequisite_skill" in q


def test_live_tools_declarations():
    tools = get_live_tools()
    assert len(tools) == 1
    func_decls = tools[0].function_declarations
    tool_names = [f.name for f in func_decls]
    assert "write_math_equation" in tool_names
    assert "highlight_board" in tool_names
    assert "switch_teaching_strategy" in tool_names
    assert "report_misconception" in tool_names
    assert "trigger_teach_back" in tool_names
    assert "show_socratic_hint" in tool_names
    assert "record_understanding_state" in tool_names
    assert "save_teacher_reflection" in tool_names
    assert "generate_transfer_challenge" in tool_names


import asyncio


def test_materials_retrieval():
    mock_user = {"id": "test-user-id", "email": "test@example.com"}
    materials = asyncio.run(get_materials(category="All", topic="Algebra", user=mock_user))
    assert len(materials) >= 4
    categories = [m["category"] for m in materials]
    assert "Guides" in categories or "Worksheets" in categories


if __name__ == "__main__":
    test_knowledge_graph_structure()
    test_diagnostic_questions_generation()
    test_live_tools_declarations()
    test_materials_retrieval()
    print("All backend logic tests passed successfully!")
