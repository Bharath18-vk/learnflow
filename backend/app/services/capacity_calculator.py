"""
LearnWise Capacity & Feasibility Calculator
Deterministic mathematical calculations for study hours, weekly commitment,
deadline capacity, projected completion dates, and feasibility gap detection.
"""

from datetime import datetime, timedelta
import math
from typing import Dict, Any, Optional, List


def calculate_learning_capacity(
    daily_minutes: int,
    days_per_week: int = 5,
    deadline_str: Optional[str] = None,
    duration_months: Optional[int] = None,
    duration_weeks: Optional[int] = None
) -> Dict[str, Any]:
    """
    Calculates deterministic available study capacity across days, weeks, months, and deadlines.
    """
    safe_minutes = max(10, min(720, daily_minutes))
    safe_days_per_week = max(1, min(7, days_per_week))
    daily_hours = round(safe_minutes / 60.0, 2)
    weekly_hours = round(daily_hours * safe_days_per_week, 2)
    monthly_hours = round(weekly_hours * 4.33, 1)

    today = datetime.utcnow().date()
    target_date = None
    days_until_deadline = None
    available_study_days = None
    total_available_hours = None

    if deadline_str and deadline_str.strip():
        try:
            clean_str = deadline_str.strip()[:10]
            target_date = datetime.strptime(clean_str, "%Y-%m-%d").date()
        except Exception:
            target_date = None

    if not target_date:
        if duration_months and duration_months > 0:
            target_date = today + timedelta(days=int(duration_months * 30.4))
        elif duration_weeks and duration_weeks > 0:
            target_date = today + timedelta(days=int(duration_weeks * 7))

    if target_date:
        days_until_deadline = max(1, (target_date - today).days)
        available_study_days = int(math.ceil(days_until_deadline * (safe_days_per_week / 7.0)))
        total_available_hours = round(available_study_days * daily_hours, 1)
    else:
        days_until_deadline = 90
        available_study_days = int(math.ceil(90 * (safe_days_per_week / 7.0)))
        total_available_hours = round(available_study_days * daily_hours, 1)

    return {
        "daily_minutes": safe_minutes,
        "daily_hours": daily_hours,
        "days_per_week": safe_days_per_week,
        "weekly_hours": weekly_hours,
        "monthly_hours": monthly_hours,
        "target_deadline": target_date.isoformat() if target_date else None,
        "days_until_deadline": days_until_deadline,
        "available_study_days": available_study_days,
        "total_available_hours": total_available_hours,
        "has_hard_deadline": target_date is not None
    }


def calculate_projected_completion(
    total_estimated_hours: float,
    weekly_hours: float,
    start_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Computes exact estimated duration (weeks) and projected completion date.
    """
    if not start_date:
        start_date = datetime.utcnow().date()
    elif isinstance(start_date, datetime):
        start_date = start_date.date()

    safe_weekly_hours = max(0.5, weekly_hours)
    safe_estimated_hours = max(1.0, total_estimated_hours)

    weeks_needed = round(safe_estimated_hours / safe_weekly_hours, 1)
    integer_weeks = max(1, int(math.ceil(weeks_needed)))
    days_needed = int(math.ceil(weeks_needed * 7))
    projected_date = start_date + timedelta(days=days_needed)

    return {
        "weeks_needed": weeks_needed,
        "estimated_duration_weeks": integer_weeks,
        "projected_completion_date": projected_date.isoformat(),
        "formatted_completion_date": projected_date.strftime("%b %d, %Y")
    }


def evaluate_feasibility(
    total_estimated_hours: float,
    total_available_hours: Optional[float] = None,
    weekly_study_hours: Optional[float] = None,
    deadline_str: Optional[str] = None,
    has_hard_deadline: Optional[bool] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Determines feasibility status ('realistic', 'tight', 'infeasible') and provides gap recommendations.
    """
    safe_avail = float(total_available_hours) if total_available_hours is not None else float((weekly_study_hours or 2.5) * 12.0)
    safe_est = float(total_estimated_hours) if total_estimated_hours is not None else 30.0

    if has_hard_deadline is None:
        has_hard_deadline = bool(deadline_str and str(deadline_str).strip())

    gap_hours = round(safe_est - safe_avail, 1)
    ratio = (safe_est / max(1.0, safe_avail))

    if not has_hard_deadline or ratio <= 1.05:
        status = "realistic"
        badge_text = "Realistic Plan"
        notes = "Your schedule provides sufficient time to comfortably master this roadmap."
        recommendations = []
    elif ratio <= 1.25:
        status = "tight"
        badge_text = "Tight Schedule"
        notes = f"This goal requires ~{total_estimated_hours}h vs your {total_available_hours}h budget. Progress requires strong consistency."
        recommendations = [
            "Consider adding 1 extra study session per week.",
            "Focus primarily on essential milestones before tackling optional topics."
        ]
    else:
        status = "infeasible"
        badge_text = "Over-Budget / Unrealistic Deadline"
        notes = f"⚠ Your current schedule provides approximately {total_available_hours}h, but this roadmap is estimated at {total_estimated_hours}h (a {gap_hours}h gap)."
        recommendations = [
            "Increase weekly study time by adjusting daily minutes or days/week.",
            "Extend your target completion deadline.",
            "Focus strictly on essential core skills and defer advanced topics.",
            "Reduce learning depth from Comprehensive to Quick Practical."
        ]

    return {
        "status": status,
        "badge_text": badge_text,
        "gap_hours": max(0.0, gap_hours),
        "notes": notes,
        "recommendations": recommendations,
        "is_realistic": status == "realistic"
    }
