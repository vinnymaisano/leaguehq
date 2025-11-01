export function get_salary_array(contracts) {
    if (!contracts || contracts.length === 0) return [];
    
    const current_year = new Date().getFullYear()
    const max_end_year = Math.max(...contracts.map(c => c.end_year))
    const num_years = max_end_year - current_year + 1

    const out = Array(num_years).fill(null)

    for (const contract of contracts) {
        const start_year = parseInt(contract.start_year)
        const end_year = parseInt(contract.end_year)
        const salary = contract.salary

        for (let y=Math.max(current_year, start_year); y <=end_year; y++) {
            const index = y - current_year
            out[index] = salary
        }
    }

    return out
}

// check if subscription is active
export function is_subscription_active(league, subHistory) {
    const now = new Date()

    // true if free trial hasn't ended yet
    let trialStatus = false
    if (league?.free_trial_end) {
      trialStatus = new Date() < new Date(league.free_trial_end)
    }

    // true if there is a subscription document for this season
    const subStatus = subHistory.some(sub => {
        const season = Number(sub.season)

        // Subscription start = Jan 1 of season
        const start = new Date(season, 0, 1) // month is 0-indexed (0 = Jan)

        // Subscription end = March 1 of next year
        const end = new Date(season + 1, 2, 1) // 2 = March

        return now >= start && now < end
    })

    return trialStatus || subStatus
}