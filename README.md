# 🏈 LeagueHQ
Add a new dimension to fantasy football with contracts, salaries, and salary cap management.

## Overview
LeagueHQ is a full-stack companion application designed to extend the Sleeper API. While Sleeper handles the real-time scoring and matchmaking, LeagueHQ acts as the financial "Source of Truth," managing complex stateful data that the native platform does not support.

It introduces a sophisticated Salary Cap Engine that allows leagues to implement custom contract logic, salary inflation, and cap-hit calculations—transforming a standard dynasty league into a comprehensive front-office simulation.

## 🛠️ Tech Stack
* **Frontend:** React.js
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (storing custom contract data not available via sleeper)
* **API:** Integration with the Sleeper API to sync league data

## Goal for This Project
While [Sleeper](https://sleeper.com/) is the premier platform for dynasty fantasy football, it lacks native support for real-life salary cap mechanics (contracts, extensions). 

LeagueHQ is a specialized management layer for hardcore leagues. It bridges the gap between traditional fantasy football and the true NFL front-office simulation by providing commissioners with the tools to enforce financial parity and strategic long-form roster construction

## Key Features
* **Sleeper roster sync:** Instantly imports league rosters and player data using the Slepeer API
* **Contract management:** Assign multi-year contracts, track salaries, and simulate salary cap impacts of potential trades.
* **Dashboard:** High level visualization of cap space for current and future seasons.
* **Transaction tracking:** Automatically calculates salary cap impact of trades and waiver wire claims in real time.
* **Draft importing:** Contracts can be imported from auction drafts (salary is the highest bid) or from rookie drafts (salary determined by round).
* **Full control:** Commissioners have full control to create, delete, and edit contracts manually to match your league's specific rules.