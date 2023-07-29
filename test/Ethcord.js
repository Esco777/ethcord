const { expect } = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Ethcord", function () {
  let deployer, user
  let ethcord

  const NAME = "Ethcord"
  const SYMBOL = "EC"

  beforeEach(async () => {
    //Setup accounts
    [deployer, user] = await ethers.getSigners()

    //Deploy Contract
    const Ethcord = await ethers.getContractFactory("Ethcord")
    ethcord = await Ethcord.deploy(NAME, SYMBOL)

    // Create a channel
    const transaction = await ethcord.connect(deployer).createChannel("general", tokens(1))
    await transaction.wait()
  })

  describe("Deployment", function () {
    it("Sets the name & symbol", async () => {
      //Fetch name
      let result = await ethcord.name()
      // Check name
      expect(result).to.equal(NAME)
    })

    it("Sets the symbol", async () => {
      //Fetch symbol
      let result= await ethcord.symbol()
      //Check symbol
      expect(result).to.equal(SYMBOL)
    })

    it("Sets the owner", async () => {
      const result = await ethcord.owner()
      expect(result).to.equal(deployer.address)
    })
  })

  describe("Creating Channels", () => {
    it('Returns total channels', async () => {
      const result = await ethcord.totalChannels()
      expect(result).to.be.equal(1)
    })

    it('Return channel attributes', async () => {
      const channel = await ethcord.getChannel(1)
      expect(channel.id).to.be.equal(1)
      expect(channel.name).to.be.equal("general")
      expect(channel.cost).to.be.equal(tokens(1))
    })
  })

  describe("Joining Channels", () => {
    const ID = 1
    const AMOUNT = ethers.utils.parseUnits("1", 'ether')

    beforeEach(async () => {
      const transaction = await ethcord.connect(user).mint(ID, { value: AMOUNT })
      await transaction.wait()
    })

    it('Joins the user', async () => {
      const result = await ethcord.hasJoined(ID, user.address)
      expect(result).to.be.equal(true)
    })

    it('Increases total supply', async () => {
      const result = await ethcord.totalSupply()
      expect(result).to.be.equal(ID)
    })

    it('Updates the contract balance', async () => {
      const result = await ethers.provider.getBalance(ethcord.address)
      expect(result).to.be.equal(AMOUNT)
    })
  })

  describe('Minting', () => {
    const ID = 1
    const AMOUNT = ethers.utils.parseUnits("1", 'ether')

    beforeEach(async () => {
      const transaction = await ethcord.connect(user).mint(ID, { value: AMOUNT})
      await transaction.wait()
    })

    it('Updates the owner', async () => {
      const owner = await ethcord.ownerOf(ID)
      expect(owner).to.be.equal(user.address)
    })

    it('Updates total supply', async () => {
      const result = await ethcord.totalSupply()
      expect(result).to.be.equal(ID)
    })

    it('Updates contract balance', async () => {
      const result = await ethers.provider.getBalance(ethcord.address)
      expect(result).to.be.equal(AMOUNT)
    })
  })

  describe("Withdrawing", () => {
    const ID = 1
    const AMOUNT = ethers.utils.parseUnits("10", 'ether')
    let balanceBefore

    beforeEach(async () => {
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      let transaction = await ethcord.connect(user).mint(ID, { value: AMOUNT })
      await transaction.wait()

      transaction = await ethcord.connect(deployer).withdraw()
      await transaction.wait()
    })

    it('Updates the owner balance', async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it('Updates the contract balance', async () => {
      const result = await ethers.provider.getBalance(ethcord.address)
      expect(result).to.equal(0)
    })
  })

})
