import api from './api'

// GET /api/credit/plan -> { success, plans } (public)
export const getPlans = async () => {
    const { data } = await api.get('/credit/plan')
    return data
}

// POST /api/credit/purchase { planId } -> { success, url } (protected)
export const purchasePlan = async (planId) => {
    const { data } = await api.post('/credit/purchase', { planId })
    return data
}
