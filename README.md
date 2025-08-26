# Pass-Go - Digital Event Ticketing Platform (Backend) [Beta Version]

This is the **backend** server application for **Pass-Go**, a full MERN stack digital event ticket selling platform designed to help small event organizers grow their events digitally.  

> **Status:** Beta version — currently implementing CI/CD pipelines and Dockerization for both frontend and backend.  

Built with **Node.js**, **Express**, and **MongoDB**, this backend provides RESTful APIs and real-time functionality to support the frontend client.

## Features

- User authentication and role management (User, Host, Admin)  
- Event creation, management, and verification with PAN card checks for Hosts  
- Low advance payment and commission system for Hosts  
- Free and paid ticket booking with real-time seat locking via Redis  
- Payment integration with Razorpay   
- Real-time notifications to users and hosts using Socket.IO  
- Media upload and management via Cloudinary  
- Transactional consistency using MongoDB sessions  
- Support for offer codes and discounts  
- Admin dashboard APIs for event approval, cancellation, and analytics  

## Tech Stack

- Node.js  
- Express.js  
- MongoDB (Mongoose )
- Redis (for caching and seat locking)  
- Socket.IO (real-time communication)  
- Cloudinary (media upload and management)  
- Payment gateway (Razorpay )  
- JWT for authentication and authorization  
- Validation and security middlewares (e.g., express-validator)  
- **Docker** (in-progress for containerization)  
- **GitHub Actions** (in-progress for CI/CD automation)

## Getting Started

### Prerequisites

- Node.js (v16 or above recommended)  
- npm or yarn  
- MongoDB Atlas or local MongoDB instance  
- Redis server (local or cloud)  
- Cloudinary account for media storage  
- Razorpay  account for payments  

### Installation

```bash
git clone <backend-repo-url>
cd backend
npm install
