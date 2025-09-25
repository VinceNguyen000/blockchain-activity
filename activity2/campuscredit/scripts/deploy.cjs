const { ethers } = require("hardhat");
async function main() {
    const initialSupply = ethers.parseUnits("1000000", 18); // 1,000,000 CAMP
    const Token = await ethers.getContractFactory("CampusCredit");
    const token = await Token.deploy(initialSupply);
    await token.waitForDeployment();
    const address = await token.getAddress();
    const [deployer] = await ethers.getSigners();
    console.log("CampusCredit deployed to:", address);
    console.log("Deployer:", deployer.address);
    const bal = await token.balanceOf(deployer.address);
    console.log("Deployer CAMP balance:", ethers.formatUnits(bal, 18));
}
main().catch((e) => {
console.error(e);
process.exit(1);
});