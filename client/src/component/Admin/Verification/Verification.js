import React, { Component } from "react";

import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";

import AdminOnly from "../../AdminOnly";

import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.json";

import "./Verification.css";

export default class Verification extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      voterCount: 0,
      voters: [],
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
      if (accounts[0] === admin) {
        this.setState({ isAdmin: true });
      }

      const voterCount = await instance.methods.getTotalVoter().call();
      this.setState({ voterCount });

      let voters = [];
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
    } catch (error) {
      alert("Failed to load web3, accounts, or contract.");
      console.error(error);
    }
  };

  renderUnverifiedVoters = (voter) => {
    const verifyVoter = async (verifiedStatus, address) => {
      await this.state.ElectionInstance.methods
        .verifyVoter(verifiedStatus, address)
        .send({ from: this.state.account, gas: 1000000 });
      window.location.reload();
    };

    const underage = voter.age < 18;

    return (
      <>
        {voter.isVerified ? (
          <div className="container-list success">
            <p>AC: {voter.address}</p>
            <table>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Age</th>
                <th>Voted</th>
              </tr>
              <tr>
                <td>{voter.name}</td>
                <td>{voter.phone}</td>
                <td>{voter.age}</td>
                <td>{voter.hasVoted ? "True" : "False"}</td>
              </tr>
            </table>
          </div>
        ) : null}

        <div
          className="container-list attention"
          style={{ display: voter.isVerified ? "none" : null }}
        >
          <table>
            <tr><th>Account address</th><td>{voter.address}</td></tr>
            <tr><th>Name</th><td>{voter.name}</td></tr>
            <tr><th>Phone</th><td>{voter.phone}</td></tr>
            <tr><th>Age</th><td>{voter.age}</td></tr>
            <tr><th>Voted</th><td>{voter.hasVoted ? "True" : "False"}</td></tr>
            <tr><th>Verified</th><td>{voter.isVerified ? "True" : "False"}</td></tr>
            <tr><th>Registered</th><td>{voter.isRegistered ? "True" : "False"}</td></tr>
          </table>
          <div style={{ marginTop: "10px" }}>
            <button
              className="btn-verification approve"
              disabled={voter.isVerified || underage}
              onClick={() => verifyVoter(true, voter.address)}
            >
              {underage ? "Underage" : "Approve"}
            </button>
          </div>
        </div>
      </>
    );
  };

  render() {
    if (!this.state.web3) {
      return (
        <>
          {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }

    if (!this.state.isAdmin) {
      return (
        <>
          <Navbar />
          <AdminOnly page="Verification Page." />
        </>
      );
    }

    return (
      <>
        <NavbarAdmin />
        <div className="container-main">
          <h3>Verification</h3>
          <small>Total Voters: {this.state.voters.length}</small>

          {this.state.voters.length < 1 ? (
            <div className="container-item info">None has registered yet.</div>
          ) : (
            <>
              <div className="container-item info">
                <center>List of registered voters</center>
              </div>
              {this.state.voters.map(this.renderUnverifiedVoters)}
            </>
          )}
        </div>
      </>
    );
  }
}
