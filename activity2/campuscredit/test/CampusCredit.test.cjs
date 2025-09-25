const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("CampusCredit", function () {
  it("mints full initial supply to deployer and transfers correctly", async function () {
    const [deployer, acct2] = await ethers.getSigners();
    const initialSupply = ethers.parseUnits("1000000", 18);
    const Token = await ethers.getContractFactory("CampusCredit");
    const token = await Token.deploy(initialSupply);
    await token.waitForDeployment();
    expect(await token.balanceOf(deployer.address)).to.equal(initialSupply);
    await token.transfer(acct2.address, ethers.parseUnits("100", 18));
    expect(await token.balanceOf(acct2.address)).to.equal(
      ethers.parseUnits("100", 18)
    );
  });
  it("approves and updates allowance", async function () {
    const [deployer, spender] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CampusCredit");
    const token = await Token.deploy(ethers.parseUnits("1000", 18));
    await token.waitForDeployment();
    await token.approve(spender.address, ethers.parseUnits("25", 18));
    expect(await token.allowance(deployer.address, spender.address)).to.equal(
      ethers.parseUnits("25", 18)
    );
  });
});
