from datetime import datetime, timedelta
from typing import Dict, Any

LEVEL_TITLES = [
    (1, "Novice Learner"),
    (2, "Consistent Explorer"),
    (3, "Skill Builder"),
    (4, "Knowledge Architect"),
    (5, "Learning Master"),
    (10, "Grandmaster")
]

def get_level_title(level: int) -> str:
    if level >= 10:
        return "Grandmaster"
    if level >= 5:
        return "Learning Master"
    if level == 4:
        return "Knowledge Architect"
    if level == 3:
        return "Skill Builder"
    if level == 2:
        return "Consistent Explorer"
    return "Novice Learner"

def get_gamification_stats(user) -> Dict[str, Any]:
    xp = getattr(user, "xp_points", 0) or 0
    level = 1 + (xp // 100)
    xp_into_level = xp % 100
    level_progress_percentage = xp_into_level # since each level is 100 XP
    title = get_level_title(level)

    current_streak = getattr(user, "current_streak", 0) or 0
    longest_streak = getattr(user, "longest_streak", 0) or 0
    streak_freezes = getattr(user, "streak_freezes", 1)
    if streak_freezes is None:
        streak_freezes = 1

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "streak_freezes": streak_freezes,
        "xp_points": xp,
        "level": level,
        "level_title": title,
        "xp_into_level": xp_into_level,
        "xp_for_next_level": 100,
        "level_progress_percentage": level_progress_percentage
    }

def record_step_completion(user, db, is_completed: bool):
    """
    Updates user XP (+50 XP / -50 XP) and updates study streak.
    """
    current_xp = getattr(user, "xp_points", 0) or 0
    
    if is_completed:
        user.xp_points = current_xp + 50
        
        today = datetime.utcnow().date()
        today_str = today.strftime("%Y-%m-%d")
        yesterday_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")
        two_days_ago_str = (today - timedelta(days=2)).strftime("%Y-%m-%d")
        
        last_date = user.last_study_date
        
        if last_date == today_str:
            # Already studied today, keep streak intact
            pass
        elif last_date == yesterday_str:
            # Studied yesterday, consecutive streak!
            user.current_streak = (user.current_streak or 0) + 1
        elif last_date == two_days_ago_str and (getattr(user, "streak_freezes", 0) or 0) > 0:
            # Missed yesterday but has streak freeze shield!
            user.streak_freezes = (user.streak_freezes or 1) - 1
            user.current_streak = (user.current_streak or 0) + 1
        else:
            # New streak starting or streak reset
            user.current_streak = 1

        user.last_study_date = today_str
        user.longest_streak = max(user.longest_streak or 0, user.current_streak)
    else:
        # Deduct XP on step un-completion
        user.xp_points = max(0, current_xp - 50)

    db.commit()
    db.refresh(user)
