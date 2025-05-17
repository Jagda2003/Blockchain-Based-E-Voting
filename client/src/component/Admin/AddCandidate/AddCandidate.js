import React, { useEffect, useState } from "react";

import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";

import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.json";

import AdminOnly from "../../AdminOnly";

import "./AddCandidate.css";

export default function AddCandidate() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [electionInstance, setElectionInstance] = useState(null);
  const [account, setAccount] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [header, setHeader] = useState("");
  const [slogan, setSlogan] = useState("");

  const [candidates, setCandidates] = useState([]);
  const [candidateCount, setCandidateCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const web3Instance = await getWeb3();
        const userAccounts = await web3Instance.eth.getAccounts();
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = Election.networks[networkId];
        const electionContract = new web3Instance.eth.Contract(
          Election.abi,
          deployedNetwork && deployedNetwork.address
        );

        setWeb3(web3Instance);
        setAccounts(userAccounts);
        setAccount(userAccounts[0]);
        setElectionInstance(electionContract);

        const count = await electionContract.methods.getTotalCandidate().call();
        setCandidateCount(count);

        const admin = await electionContract.methods.getAdmin().call();
        if (userAccounts[0] === admin) {
          setIsAdmin(true);
        }

        // Load Candidates
        const loadedCandidates = [];
        for (let i = 0; i < count; i++) {
          const candidate = await electionContract.methods.candidateDetails(i).call();
          loadedCandidates.push({
            id: candidate.candidateId,
            header: candidate.header,
            slogan: candidate.slogan,
          });
        }
        setCandidates(loadedCandidates);
      } catch (error) {
        console.error("Error loading web3, accounts, or contract:", error);
        alert("Failed to load web3, accounts, or contract. Check console for details.");
      }
    };

    init();
  }, []);

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      await electionInstance.methods
        .addCandidate(header, slogan)
        .send({ from: account, gas: 1000000 });

      window.location.reload(); // optional - you can also just fetch again instead of full reload
    } catch (error) {
      console.error("Error adding candidate:", error);
      alert("Error adding candidate. Check console.");
    }
  };

  if (!web3) {
    return (
      <>
        {isAdmin ? <NavbarAdmin /> : <Navbar />}
        <center>Loading Web3, accounts, and contract...</center>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <AdminOnly page="Add Candidate Page." />
      </>
    );
  }

  return (
    <>
      <NavbarAdmin />
      <div className="container-main">
        <h2>Add a new candidate</h2>
        <small>Total candidates: {candidateCount}</small>

        <div className="container-item">
          <form className="form" onSubmit={handleAddCandidate}>
            <label className="label-ac">
              Name
              <input
                className="input-ac"
                type="text"
                placeholder="eg. Marcus"
                value={header}
                onChange={(e) => setHeader(e.target.value)}
              />
            </label>
            <label className="label-ac">
              Slogan
              <input
                className="input-ac"
                type="text"
                placeholder="eg. It is what it is"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="btn-add"
              disabled={header.length < 3 || header.length > 21}
            >
              Add
            </button>
          </form>
        </div>
      </div>

      <CandidateList candidates={candidates} />
    </>
  );
}

function CandidateList({ candidates }) {
  return (
    <div className="container-main" style={{ borderTop: "1px solid" }}>
      <div className="container-item info">
        <center>Candidates List</center>
      </div>

      {candidates.length === 0 ? (
        <div className="container-item alert">
          <center>No candidates added.</center>
        </div>
      ) : (
        <div
          className="container-item"
          style={{ display: "block", backgroundColor: "#DDFFFF" }}
        >
          {candidates.map((candidate) => (
            <div className="container-list success" key={candidate.id}>
              <div style={{ maxHeight: "21px", overflow: "auto" }}>
                {candidate.id}. <strong>{candidate.header}</strong>: {candidate.slogan}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
