import logging
import re
from typing import List, Dict
import urllib.parse
import requests
from app.config import settings

logger = logging.getLogger(__name__)

def extract_keywords(goal_title: str, step_title: str) -> str:
    text = f"{goal_title} {step_title}"
    words = re.findall(r'\b[A-Za-z0-9+#.-]{2,}\b', text)
    stopwords = {'for', 'and', 'the', 'with', 'using', 'in', 'to', 'of', 'a', 'an', 'beginner', 'intermediate', 'advanced', 'mastery', 'fundamentals', 'foundations'}
    filtered = [w for w in words if w.lower() not in stopwords]
    return " ".join(filtered[:5]) if filtered else goal_title

def fetch_youtube_resources(query: str, max_results: int = 1) -> List[Dict]:
    try:
        from googleapiclient.discovery import build
        if not settings.YOUTUBE_API_KEY:
            raise ValueError("YOUTUBE_API_KEY is not set")
        
        youtube = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)
        request = youtube.search().list(
            part="snippet",
            maxResults=max_results,
            q=query + " tutorial educational",
            type="video"
        )
        response = request.execute()
        
        results = []
        for item in response.get('items', []):
            results.append({
                "title": item['snippet']['title'],
                "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                "resource_type": "youtube",
                "thumbnail": item['snippet']['thumbnails']['default']['url'],
                "channel_name": item['snippet']['channelTitle']
            })
        if results:
            return results
    except Exception as e:
        logger.warning(f"YouTube API failed: {e}. Falling back to search URL.")
    
    formatted_query = urllib.parse.quote_plus(query)
    return [{
        "title": f"YouTube Video Tutorial for {query}",
        "url": f"https://www.youtube.com/results?search_query={formatted_query}+tutorial",
        "resource_type": "youtube"
    }]

def fetch_coursera_resources(step_title: str, goal_title: str) -> List[Dict]:
    keywords = extract_keywords(goal_title, step_title)
    formatted_query = urllib.parse.quote_plus(keywords)
    return [{
        "title": f"Coursera Course: {step_title}",
        "url": f"https://www.google.com/search?q=site:coursera.org+{formatted_query}+course",
        "resource_type": "course"
    }]

def fetch_github_resources(step_title: str, goal_title: str) -> List[Dict]:
    keywords = extract_keywords(goal_title, step_title)
    try:
        headers = {"User-Agent": "LearnWiseApp/1.0"}
        search_url = f"https://api.github.com/search/repositories?q={urllib.parse.quote_plus(keywords)}&sort=stars&order=desc"
        response = requests.get(search_url, headers=headers, timeout=4)
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            if items:
                top_repo = items[0]
                stars = top_repo.get("stargazers_count", 0)
                stars_str = f"{stars:,}★" if stars > 0 else ""
                repo_name = top_repo.get("full_name", top_repo.get("name", step_title))
                return [{
                    "title": f"GitHub: {repo_name} ({stars_str})".strip(),
                    "url": top_repo["html_url"],
                    "resource_type": "practice"
                }]
    except Exception as e:
        logger.warning(f"GitHub API search failed: {e}. Falling back to search URL.")

    formatted_query = urllib.parse.quote_plus(keywords)
    return [{
        "title": f"GitHub Repositories for {step_title}",
        "url": f"https://github.com/search?q={formatted_query}&type=repositories",
        "resource_type": "practice"
    }]

def fetch_docs_resources(step_title: str, goal_title: str) -> List[Dict]:
    keywords = extract_keywords(goal_title, step_title)
    formatted_query = urllib.parse.quote_plus(keywords)
    return [{
        "title": f"Documentation & Guide for {step_title}",
        "url": f"https://www.google.com/search?q=official+documentation+{formatted_query}",
        "resource_type": "docs"
    }]

def fetch_all_resources(step_title: str, goal_title: str, skill_level: str = 'Beginner') -> List[Dict]:
    try:
        yt_query = f"{goal_title} {step_title} {skill_level}"
        resources = []
        
        youtube_res = fetch_youtube_resources(yt_query, max_results=1)
        if youtube_res:
            resources.extend(youtube_res)
            
        resources.extend(fetch_coursera_resources(step_title, goal_title))
        resources.extend(fetch_github_resources(step_title, goal_title))
        resources.extend(fetch_docs_resources(step_title, goal_title))
        
        return resources
    except Exception as e:
        logger.error(f"Error fetching all resources: {e}")
        formatted_query = urllib.parse.quote_plus(f"{goal_title} {step_title}")
        return [{
            "title": f"Google Search for {step_title}",
            "url": f"https://www.google.com/search?q={formatted_query}",
            "resource_type": "article"
        }]
