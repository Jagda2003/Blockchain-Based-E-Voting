// Node modules
import React, { Component } from "react";

// Components
import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

// CSS
import "./Registration.css";

// Contract
import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

export default class Registration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      web3: null,
      account: null,
      isAdmin: false,
      isElStarted: false,
      isElEnded: false,
      voterCount: undefined,
      voterName: "",
      voterPhone: "",
      voterAge: "",
      voters: [],
      currentVoter: {
        address: undefined,
        name: null,
        phone: null,
        age: null,
        hasVoted: false,
        isVerified: false,
        isRegistered: false,
      },
    };
  }

  componentDidMount = async () => {
    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
    }
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork && deployedNetwork.address
      );

      this.setState({ web3, ElectionInstance: instance, account: accounts[0] });

      const admin = await instance.methods.getAdmin().call();
      if (accounts[0] === admin) this.setState({ isAdmin: true });

      const start = await instance.methods.getStart().call();
      const end = await instance.methods.getEnd().call();
      this.setState({ isElStarted: start, isElEnded: end });

      const voterCount = await instance.methods.getTotalVoter().call();
      this.setState({ voterCount });

      const voters = [];
      for (let i = 0; i < voterCount; i++) {
        const voterAddress = await instance.methods.voters(i).call();
        const voter = await instance.methods.voterDetails(voterAddress).call();
        voters.push({
          address: voter.voterAddress,
          name: voter.name,
          phone: voter.phone,
          age: voter.age,
          hasVoted: voter.hasVoted,
          isVerified: voter.isVerified,
          isRegistered: voter.isRegistered,
        });
      }
      this.setState({ voters });

      const current = await instance.methods.voterDetails(accounts[0]).call();
      this.setState({
        currentVoter: {
          address: current.voterAddress,
          name: current.name,
          phone: current.phone,
          age: current.age,
          hasVoted: current.hasVoted,
          isVerified: current.isVerified,
          isRegistered: current.isRegistered,
        },
      });
    } catch (error) {
      console.error(error);
      alert("Failed to load web3, accounts, or contract.");
    }
  };

  updateVoterName = (e) => this.setState({ voterName: e.target.value });
  updateVoterPhone = (e) => this.setState({ voterPhone: e.target.value });
  updateVoterAge = (e) => this.setState({ voterAge: e.target.value });

  isFormValid = () => {
    const { voterName, voterPhone, voterAge, currentVoter } = this.state;
    return (
      voterName.trim() !== "" &&
      /^\d{10}$/.test(voterPhone) &&
      Number(voterAge) >= 18 &&
      !currentVoter.isVerified
    );
  };

  registerAsVoter = async () => {
    await this.state.ElectionInstance.methods
      .registerAsVoter(this.state.voterName, this.state.voterPhone, this.state.voterAge)
      .send({ from: this.state.account, gas: 1000000 });
    window.location.reload();
  };
  

  render() {
    const { web3, isAdmin, isElStarted, isElEnded, account, voterName, voterPhone, voterAge, currentVoter, voters } = this.state;
    if (!web3) {
      return (
        <>
          {isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }
    return (
      <>
        {isAdmin ? <NavbarAdmin /> : <Navbar />}
        {!isElStarted && !isElEnded ? (
          <NotInit />
        ) : (
          <>
            <div className="container-item info">
              <p>Total registered voters: {voters.length}</p>
            </div>
            <div className="container-main">
              <h3>Registration</h3>
              <small>Register to vote.</small>
              <div className="container-item">
                <form onSubmit={this.registerAsVoter}>
                  <div className="div-li">
                    <label className="label-r">
                      Account Address
                      <input className="input-r" type="text" value={account} disabled style={{ width: "400px" }} />
                    </label>
                  </div>
                  <div className="div-li">
                    <label className="label-r">
                      Name
                      <input className="input-r" type="text" placeholder="eg. Ava" value={voterName} onChange={this.updateVoterName} />
                    </label>
                  </div>
                  <div className="div-li">
                    <label className="label-r">
                      Phone number <span style={{ color: "tomato" }}>*</span>
                      <input className="input-r" type="number" placeholder="eg. 9841234567" value={voterPhone} onChange={this.updateVoterPhone} />
                    </label>
                  </div>
                  <div className="div-li">
                    <label className="label-r">
                      Age <span style={{ color: "tomato" }}>*</span>
                      <input className="input-r" type="number" placeholder="eg. 19" value={voterAge} onChange={this.updateVoterAge} />
                    </label>
                  </div>
                  <p className="note">
                    <span style={{ color: "tomato" }}>Note:</span><br />
                    Ensure your details are correct and should Match with Admin's Data. Voting is only allowed if your age is 18 or older.
                  </p>
                  <button className="btn-add" disabled={!this.isFormValid()}>
                    {currentVoter.isRegistered ? "Update" : "Register"}
                  </button>
                </form>
              </div>
            </div>
            <div className="container-main" style={{ borderTop: currentVoter.isRegistered ? null : "1px solid" }}>
              {loadCurrentVoter(currentVoter, currentVoter.isRegistered)}
            </div>
            {isAdmin && (
              <div className="container-main" style={{ borderTop: "1px solid" }}>
                <small>TotalVoters: {voters.length}</small>
                {loadAllVoters(voters)}
              </div>
            )}
          </>
        )}
      </>
    );
  }
}

export function loadCurrentVoter(voter, isRegistered) {
  return (
    <>
      <div className={"container-item " + (isRegistered ? "success" : "attention")}>
        <center>Your Registered Info</center>
      </div>
      <div className={"container-list " + (isRegistered ? "success" : "attention")}>
        <table>
          <tbody>
            <tr><th>Account Address</th><td>{voter.address}</td></tr>
            <tr><th>Name</th><td>{voter.name}</td></tr>
            <tr><th>Phone</th><td>{voter.phone}</td></tr>
            <tr><th>Age</th><td>{voter.age}</td></tr>
            <tr><th>Voted</th><td>{voter.hasVoted ? "True" : "False"}</td></tr>
            <tr><th>Verified</th><td>{voter.isVerified ? "True" : "False"}</td></tr>
            <tr><th>Registered</th><td>{voter.isRegistered ? "True" : "False"}</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export function loadAllVoters(voters) {
  return (
    <>
      <div className="container-item success">
        <center>List of voters</center>
      </div>
      {voters.map((voter, index) => (
        <div key={index} className="container-list success">
          <table>
            <tbody>
              <tr><th>Account address</th><td>{voter.address}</td></tr>
              <tr><th>Name</th><td>{voter.name}</td></tr>
              <tr><th>Phone</th><td>{voter.phone}</td></tr>
              <tr><th>Age</th><td>{voter.age}</td></tr>
              <tr><th>Voted</th><td>{voter.hasVoted ? "True" : "False"}</td></tr>
              <tr><th>Verified</th><td>{voter.isVerified ? "True" : "False"}</td></tr>
              <tr><th>Registered</th><td>{voter.isRegistered ? "True" : "False"}</td></tr>
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
