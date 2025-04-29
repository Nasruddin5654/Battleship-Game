# 🛠 How to Run the Game Locally

## 1. Clone the GitHub Repository

```bash
git clone https://github.com/Nasruddin5654/Build-Fellowship-Project.git
```


## 2. Open Two Terminal Windows (or Tabs)
You'll run the frontend and the server separately.

🖥 First Terminal — Frontend Setup

```
cd Build-Fellowship-Project
```
```
  npm install
```
```
npm run dev
```
This will start the Vite development server, usually at http://localhost:5173.

🌐 Second Terminal — Socket Server Setup
```
cd Build-Fellowship-Project
```
```
cd server
```
```
npm install
```
```
node server.js
```
This starts the WebSocket server on http://localhost:4000.
