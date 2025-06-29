// api.tsx (assuming you meant App.tsx as the main routing file)
import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";// Make sure this path is correct if you renamed it
import Testpage from "./pages/Testpage";
import Upload from "./pages/Upload"; // Import the Upload component
const App: React.FC = () => {
  return (
    <Router>
      <div style={{ padding: 20 }}>
        <nav> {/* <-- THIS WAS THE FIX: Changed to /charts */}
          <Link to="/test">View Test</Link>
        </nav>
        <nav> {/* <-- THIS WAS THE FIX: Changed to /charts */}
          <Link to="/upload">Click to upload</Link>
        </nav>
        <hr />
        <Routes>
          <Route path="/test" element={<Testpage />} />
          <Route path="/" element={<Upload />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

