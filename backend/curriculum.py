"""Demo mathematics curriculum and mastery-based lesson selection."""

from collections.abc import Sequence

MASTERY_TARGET = 0.8

CURRICULUM = {
    "Pre-Algebra": [
        {"title": "Order of Operations", "skills": ["Pre-Algebra: order of operations"], "outcomes": ["Evaluate expressions using PEMDAS", "Use parentheses correctly", "Check an answer by substituting values"]},
        {"title": "Integers and Signed Numbers", "skills": ["Pre-Algebra: integer operations"], "outcomes": ["Add and subtract signed integers", "Multiply and divide signed integers", "Explain why the sign of an answer is positive or negative"]},
        {"title": "Fractions and Ratios", "skills": ["Pre-Algebra: fractions and ratios"], "outcomes": ["Simplify a fraction", "Find an equivalent fraction", "Solve a ratio problem"]},
    ],
    "Algebra": [
        {"title": "Variables and Expressions", "skills": ["Algebra: variables and expressions"], "outcomes": ["Identify variables, coefficients, and constants", "Translate a phrase into an algebraic expression", "Evaluate an expression for a given value"]},
        {"title": "Combining Like Terms", "skills": ["Algebra: combining like terms"], "outcomes": ["Recognize like terms", "Simplify expressions by combining like terms", "Explain why unlike terms cannot be combined"]},
        {"title": "Linear Equations", "skills": ["Algebra: linear equations"], "outcomes": ["Solve one-step and two-step equations", "Perform the same operation on both sides", "Check a solution by substitution"]},
        {"title": "Distributive Property", "skills": ["Algebra: distributive property", "Algebra: negative signs"], "outcomes": ["Distribute a factor to every term in parentheses", "Handle a negative multiplier correctly", "Expand and simplify an expression"]},
    ],
    "Functions": [
        {"title": "Relations and Functions", "skills": ["Functions: identifying functions"], "outcomes": ["Tell a relation from a function", "Use the vertical-line test", "Identify input and output values"]},
        {"title": "Function Tables", "skills": ["Functions: tables"], "outcomes": ["Evaluate a function from a table", "Complete a table from a rule", "Describe a pattern of change"]},
        {"title": "Graphing Linear Functions", "skills": ["Functions: graphing lines"], "outcomes": ["Plot ordered pairs", "Identify slope and intercept", "Graph a linear equation"]},
    ],
    "Geometry": [
        {"title": "Angles", "skills": ["Geometry: angle relationships"], "outcomes": ["Classify angles", "Use complementary and supplementary relationships", "Solve for an unknown angle"]},
        {"title": "Triangles", "skills": ["Geometry: triangles"], "outcomes": ["Classify triangles", "Use the triangle angle-sum theorem", "Find a missing interior angle"]},
        {"title": "Area and Volume", "skills": ["Geometry: area and volume"], "outcomes": ["Choose an appropriate area formula", "Calculate volume of a prism", "Use correct square or cubic units"]},
    ],
    "Statistics": [
        {"title": "Reading Data Displays", "skills": ["Statistics: data displays"], "outcomes": ["Read bar, line, and circle graphs", "Compare quantities in a data display", "Identify misleading graph scales"]},
        {"title": "Measures of Center", "skills": ["Statistics: mean median mode"], "outcomes": ["Calculate mean, median, and mode", "Choose an appropriate measure of center", "Describe the effect of an outlier"]},
        {"title": "Probability", "skills": ["Statistics: probability"], "outcomes": ["Express probability as a fraction, decimal, or percent", "Find probabilities of simple events", "Compare theoretical and experimental probability"]},
    ],
}


def course_for_topic(topic: str) -> str:
    normalized = topic.casefold()
    return next((course for course in CURRICULUM if course.casefold() in normalized), "Algebra")


def lesson_for_learner(topic: str, mastery_rows: Sequence[dict]) -> dict:
    course = course_for_topic(topic)
    mastery_by_skill = {row["skill"]: float(row["mastery"]) for row in mastery_rows}
    lessons = CURRICULUM[course]
    lesson = next((item for item in lessons if any(mastery_by_skill.get(skill, 0) < MASTERY_TARGET for skill in item["skills"])), lessons[-1])
    skill_status = [{"skill": skill, "mastery": mastery_by_skill.get(skill, 0), "target": MASTERY_TARGET} for skill in lesson["skills"]]
    return {"course": course, "lesson": lesson["title"], "outcomes": lesson["outcomes"], "skills": skill_status}
