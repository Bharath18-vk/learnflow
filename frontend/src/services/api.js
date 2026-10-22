const getBaseUrl = () => {
    if (import.meta.env && import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    // Check if running inside Capacitor native Android container
    if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform()) {
        const platform = window.Capacitor.getPlatform();
        if (platform === "android") {
            return "http://10.0.2.2:8000/api";
        }
    }
    if (typeof window !== "undefined" && window.location?.origin) {
        return "/api";
    }
    return "http://127.0.0.1:8000/api";
};

const API_BASE_URL = getBaseUrl();

function getAuthHeaders() {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
}

export function formatApiError(detail, fallbackMessage = "An unexpected error occurred.") {
    if (!detail) return fallbackMessage;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail.map(item => {
            if (typeof item === "string") return item;
            if (item && item.msg) {
                const field = item.loc && item.loc.length ? item.loc[item.loc.length - 1] : "";
                return field ? `${field}: ${item.msg}` : item.msg;
            }
            return JSON.stringify(item);
        }).join("; ");
    }
    if (typeof detail === "object") {
        return detail.msg || detail.message || JSON.stringify(detail);
    }
    return String(detail);
}

async function apiFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        return response;
    } catch (err) {
        if (err instanceof TypeError || err.name === "TypeError" || err.message === "Failed to fetch") {
            if (url.startsWith("/api")) {
                try {
                    const fallbackUrl = `http://127.0.0.1:8000${url}`;
                    return await fetch(fallbackUrl, options);
                } catch (retryErr) {
                    // fallback failed
                }
            }
            const error = new Error("Unable to connect to LearnWise backend server. Please make sure the backend server is running on http://localhost:8000.");
            error.status = 0;
            throw error;
        }
        throw err;
    }
}

export async function registerUser(userData) {
    const response = await apiFetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Registration failed. Please try again.");
    }

    if (data.access_token) {
        localStorage.setItem("token", data.access_token);
    }
    if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
}

export async function loginUser(credentials) {
    const response = await apiFetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.detail || "Login failed. Please check your credentials.");
        error.status = response.status;
        throw error;
    }

    if (data.access_token) {
        localStorage.setItem("token", data.access_token);
    }
    if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
}

export async function verifyEmail(token) {
    const response = await apiFetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (!response.ok) {
        const error = new Error(data.detail || "Failed to verify email token.");
        error.status = response.status;
        throw error;
    }

    if (data.access_token) {
        localStorage.setItem("token", data.access_token);
    }
    if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
}

export async function resendVerification(email) {
    const response = await apiFetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
        const error = new Error(data.detail || "Failed to resend verification email.");
        error.status = response.status;
        throw error;
    }
    return data;
}

export async function forgotPassword(email) {
    const response = await apiFetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
        const error = new Error(data.detail || "Failed to process forgot password request.");
        error.status = response.status;
        throw error;
    }
    return data;
}

export async function resetPassword({ token, new_password }) {
    const response = await apiFetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password }),
    });

    const data = await response.json();
    if (!response.ok) {
        const error = new Error(data.detail || "Failed to reset password.");
        error.status = response.status;
        throw error;
    }
    return data;
}

export async function getVerificationStatus() {
    const response = await apiFetch(`${API_BASE_URL}/auth/verification-status`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch verification status.");
    }
    return data;
}

export async function generateRoadmap(onboardingData) {
    const response = await apiFetch(`${API_BASE_URL}/roadmap/generate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(onboardingData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(formatApiError(data.detail, "Failed to generate roadmap."));
    }

    return data;
}

export async function getActiveRoadmap() {
    const response = await apiFetch(`${API_BASE_URL}/roadmap/active`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch active roadmap.");
    }

    return data;
}

export async function getAllUserGoals() {
    const response = await apiFetch(`${API_BASE_URL}/roadmap/all`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch user goals.");
    }

    return data;
}

export async function activateGoal(goalId) {
    const response = await apiFetch(`${API_BASE_URL}/roadmap/goals/${goalId}/activate`, {
        method: "POST",
        headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Failed to switch active goal.");
    }

    return data;
}

export async function deleteGoal(goalId) {
    const response = await apiFetch(`${API_BASE_URL}/roadmap/goals/${goalId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Failed to delete goal.");
    }

    return data;
}

export async function toggleStepCompletion(stepId) {
    const response = await apiFetch(`${API_BASE_URL}/roadmap/steps/${stepId}/toggle`, {
        method: "POST",
        headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Failed to toggle step.");
    }

    return data;
}

export async function refineRoadmap(goalId, refinementPrompt) {
    const response = await apiFetch(`${API_BASE_URL}/roadmap/refine`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ goal_id: goalId, refinement_prompt: refinementPrompt }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to refine roadmap.");
    }
    return data;
}

export async function exportRoadmapData() {
    const response = await apiFetch(`${API_BASE_URL}/roadmap/export`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to export roadmap data.");
    }
    return data;
}

export async function getStepQuiz(stepId) {
    const response = await apiFetch(`${API_BASE_URL}/roadmap/steps/${stepId}/quiz`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch quiz for step.");
    }
    return data;
}

export async function submitStepQuiz(stepId, answersOrScore, quizSessionTokenOrTotal = null) {
    let payload;
    if (typeof answersOrScore === "object" && answersOrScore !== null) {
        payload = {
            answers: answersOrScore,
            quiz_session_token: quizSessionTokenOrTotal
        };
    } else {
        payload = {
            score: answersOrScore,
            total: quizSessionTokenOrTotal || 3
        };
    }
    const response = await apiFetch(`${API_BASE_URL}/roadmap/steps/${stepId}/quiz/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to submit quiz.");
    }
    return data;
}

export async function queryAiTutor(stepId, promptType = "explain_simple", customQuery = "") {
    const response = await apiFetch(`${API_BASE_URL}/roadmap/steps/${stepId}/tutor`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ prompt_type: promptType, custom_query: customQuery })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to reach AI Tutor.");
    }
    return data;
}

// ==========================================================================
// PHASE 2: INTERNAL LEARNING EXPERIENCE API
// ==========================================================================

export async function getMilestoneLearning(stepId) {
    const response = await apiFetch(`${API_BASE_URL}/learning/milestones/${stepId}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch milestone learning content.");
    }
    return data;
}

export async function generateMilestoneLearning(stepId, force = false) {
    const response = await apiFetch(`${API_BASE_URL}/learning/milestones/${stepId}/generate?force=${force}`, {
        method: "POST",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to generate learning lesson for this milestone.");
    }
    return data;
}

export async function getLearningContent(contentId) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to load learning content.");
    }
    return data;
}

export async function updateLearningProgress(contentId, payload) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}/progress`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to update learning progress.");
    }
    return data;
}

export async function submitCheckpointAssessment(contentId, answers) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}/checkpoint`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to submit checkpoint assessment.");
    }
    return data;
}

export async function getLearningNotes(contentId) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}/notes`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch learning notes.");
    }
    return data;
}

export async function createLearningNote(contentId, payload) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}/notes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to create note.");
    }
    return data;
}

export async function updateLearningNote(noteId, payload) {
    const response = await apiFetch(`${API_BASE_URL}/learning/notes/${noteId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to update note.");
    }
    return data;
}

export async function deleteLearningNote(noteId) {
    const response = await apiFetch(`${API_BASE_URL}/learning/notes/${noteId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete note.");
    }
    return true;
}

export async function toggleLearningBookmark(contentId, payload = {}) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}/bookmark`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to toggle bookmark.");
    }
    return data;
}

export async function getActiveLearningSession() {
    const response = await apiFetch(`${API_BASE_URL}/learning/active-session`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch active learning session.");
    }
    return data;
}

// ==========================================
// Phase 3: Concept Mastery, Assessment & Remediation
// ==========================================

export async function getPublicAssessmentQuestions(contentId) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}/assessment/questions`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch assessment questions.");
    }
    return data;
}

export async function startAssessmentSession(contentId) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}/assessment/start`, {
        method: "POST",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to start assessment session.");
    }
    return data;
}

export async function getAssessmentHistory(contentId) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}/assessment/history`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch assessment history.");
    }
    return data;
}

export async function getConceptMastery(contentId) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}/mastery`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch concept mastery data.");
    }
    return data;
}

export async function getWeakConcepts(contentId) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}/weak-concepts`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch weak concepts.");
    }
    return data;
}

export async function createConceptRemediation(contentId, conceptId) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}/remediation/${conceptId}`, {
        method: "POST",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to generate targeted remediation.");
    }
    return data;
}

export async function submitRemediationReassessment(contentId, remediationId, answers) {
    const response = await apiFetch(`${API_BASE_URL}/learning/${contentId}/remediation/${remediationId}/reassess`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to submit reassessment.");
    }
    return data;
}

export async function getDashboardMasterySummary() {
    const response = await apiFetch(`${API_BASE_URL}/learning/dashboard/mastery-summary`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch dashboard mastery summary.");
    }
    return data;
}



