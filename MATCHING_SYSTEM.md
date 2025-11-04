# BlockLearn Matching System

## Overview

The BlockLearn matching system implements a rule-based algorithm to connect students with mentors based on multiple factors. This system serves as the foundation for both immediate functionality and future AI enhancement.

## Algorithm Components

The matching algorithm calculates a composite score based on five weighted factors:

### 1. Skill Matching (35% weight)
- Evaluates if the mentor offers the requested skill
- Considers proficiency level differences between student and mentor
- Higher scores for mentors with greater expertise

### 2. Campus Proximity (20% weight)
- Prioritizes mentors from the same campus
- Provides partial credit for different campuses

### 3. Availability Overlap (25% weight)
- Calculates time slot compatibility between student and mentor
- Considers day and time overlaps in availability schedules

### 4. Experience Level (10% weight)
- Rewards mentors with more completed sessions
- Considers average session duration as a quality indicator

### 5. Rating/Reputation (10% weight)
- Factors in mentor ratings from previous sessions
- Considers the quantity of ratings for reliability

## Data Collection for ML Training

The system automatically collects data to train future AI models:

### Match History
- Records each student-mentor pairing
- Stores calculated match scores and breakdowns
- Tracks skill requests and responses

### Session Outcomes
- Records whether matches led to actual sessions
- Captures feedback data and ratings
- Tracks session duration and completion status

## API Endpoints

### Get Matching Mentors
```
GET /api/matching/mentors/:skillId
```
Returns ranked list of mentors for a specific skill.

### Get Match Detail
```
GET /api/matching/match-detail/:mentorId/:skillId
```
Returns detailed analysis of a specific student-mentor match.

### Get Training Data
```
GET /api/matching/training-data
```
Exports dataset for ML model training.

## Database Schema

New tables added for matching functionality:

### match_history
Stores historical match data for ML training.

### session_outcomes
Records the results of mentor-student connections.

## Future AI Enhancement

The collected dataset will be used to train a machine learning model that can:
- Improve match accuracy over time
- Identify new factors that influence successful connections
- Personalize matching based on individual user preferences
- Predict session success rates

## Implementation Files

- `backend/routes/matching.js` - API endpoints
- `backend/utils/matchingService.js` - Core matching logic
- `backend/models/add_matching_tables.sql` - Database schema
- `frontend/src/components/MatchingSystem.jsx` - Frontend component
- `frontend/src/api.js` - Updated API client

## Usage

The matching system is automatically invoked when students search for mentors for specific skills. All interactions are recorded to build the training dataset for future AI implementation.