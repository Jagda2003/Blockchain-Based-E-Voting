import React, { Component } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Home from "./component/Home";
import Voting from "./component/Voting/Voting";
import Results from "./component/Results/Results";
import Registration from "./component/Registration/Registration";
import AddCandidate from "./component/Admin/AddCandidate/AddCandidate";
import Verification from "./component/Admin/Verification/Verification";
import Test from "./component/test";
import Footer from "./component/Footer/Footer";

import "./App.css";

export default class App extends Component {
  render() {
    return (
      <div className="App">
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/addcandidate" element={<AddCandidate />} />
            <Route path="/voting" element={<Voting />} />
            <Route path="/results" element={<Results />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/test" element={<Test />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Footer />
      </div>
    );
  }
}

class NotFound extends Component {
  render() {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>404 NOT FOUND!</h1>
        <p>
          The page you're looking for doesn't exist.<br />
          Go back to{" "}
          <Link to="/" style={{ color: "black", textDecoration: "underline" }}>
            Home
          </Link>
        </p>
      </div>
    );
  }
}
