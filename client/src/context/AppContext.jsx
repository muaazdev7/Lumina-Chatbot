import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    getToken, setToken as persistToken, clearToken,
    setUnauthorizedHandler, getErrorMessage
} from "../services/api";
import * as authService from "../services/authService";
import * as chatService from "../services/chatService";

const AppContext = createContext()

export const AppContextProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [token, setTokenState] = useState(getToken());
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    // True while the initial session check is in flight, so the login screen
    // does not flash before we know whether the user is signed in.
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingChats, setLoadingChats] = useState(false);

    const logout = useCallback((message) => {
        clearToken()
        setTokenState(null)
        setUser(null)
        setChats([])
        setSelectedChat(null)
        if (message) toast.success(message)
    }, [])

    // Any 401 from the API drops the session.
    useEffect(() => {
        setUnauthorizedHandler(() => {
            setTokenState(null)
            setUser(null)
            setChats([])
            setSelectedChat(null)
            toast.error('Session expired, please log in again')
        })
    }, [])

    // Theme handling (unchanged behaviour)
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme)
    }, [theme])

    const fetchUser = useCallback(async () => {
        if (!getToken()) {
            setUser(null)
            setLoadingUser(false)
            return null
        }
        try {
            const data = await authService.getCurrentUser()
            if (data.success) {
                setUser(data.user)
                // Returned so callers (e.g. the Stripe return page) can read the
                // fresh balance without waiting for a re-render.
                return data.user
            }
            setUser(null)
            return null
        } catch (error) {
            // 401 is already handled by the interceptor; report anything else.
            if (error?.response?.status !== 401) {
                toast.error(getErrorMessage(error, 'Failed to load your account'))
            }
            setUser(null)
            return null
        } finally {
            setLoadingUser(false)
        }
    }, [])

    const fetchUserChats = useCallback(async () => {
        setLoadingChats(true)
        try {
            const data = await chatService.getChats()
            if (!data.success) {
                toast.error(data.message || 'Failed to load chats')
                return
            }

            let list = data.chats

            // A brand new account has no chats yet - create the first one.
            if (list.length === 0) {
                const created = await chatService.createChat()
                if (created.success && created.chat) {
                    list = [created.chat]
                }
            }

            setChats(list)
            setSelectedChat((current) => {
                // Keep the current selection if it still exists.
                const stillThere = current && list.find(c => c._id === current._id)
                return stillThere || list[0] || null
            })
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to load chats'))
        } finally {
            setLoadingChats(false)
        }
    }, [])

    const createNewChat = useCallback(async () => {
        try {
            const data = await chatService.createChat()
            if (!data.success) {
                toast.error(data.message || 'Failed to create chat')
                return null
            }
            setChats(prev => [data.chat, ...prev])
            setSelectedChat(data.chat)
            return data.chat
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to create chat'))
            return null
        }
    }, [])

    const removeChat = useCallback(async (chatId) => {
        try {
            const data = await chatService.deleteChat(chatId)
            if (!data.success) {
                toast.error(data.message || 'Failed to delete chat')
                return
            }
            setChats(prev => {
                const next = prev.filter(c => c._id !== chatId)
                setSelectedChat(current => (current?._id === chatId ? (next[0] || null) : current))
                return next
            })
            toast.success('Chat deleted')
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to delete chat'))
        }
    }, [])

    const login = useCallback(async ({ email, password }) => {
        const data = await authService.loginUser({ email, password })
        if (data.success) {
            persistToken(data.token)
            setTokenState(data.token)
            if (data.user) setUser(data.user)
        }
        return data
    }, [])

    const register = useCallback(async ({ name, email, password }) => {
        const data = await authService.registerUser({ name, email, password })
        if (data.success) {
            persistToken(data.token)
            setTokenState(data.token)
            if (data.user) setUser(data.user)
        }
        return data
    }, [])

    // Keeps the sidebar credit counter in sync after generating / purchasing.
    const setCredits = useCallback((credits) => {
        setUser(prev => (prev ? { ...prev, credits } : prev))
    }, [])

    // Load the session on mount and whenever the token changes.
    useEffect(() => {
        fetchUser()
    }, [token, fetchUser])

    // Load chats once we have a user; clear them on logout.
    useEffect(() => {
        if (user) {
            fetchUserChats()
        } else {
            setChats([])
            setSelectedChat(null)
        }
    }, [user?._id, fetchUserChats])

    const value = {
        navigate,
        user, setUser, fetchUser, login, register, logout,
        token, loadingUser, loadingChats,
        chats, setChats, fetchUserChats, createNewChat, removeChat,
        selectedChat, setSelectedChat,
        theme, setTheme, setCredits,
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => useContext(AppContext)
