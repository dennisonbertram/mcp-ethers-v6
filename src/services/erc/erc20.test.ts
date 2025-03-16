it('should handle zero balance for valid ERC20 token', async () => {
  (balanceCache.get as jest.Mock).mockReturnValue(null);
  (contractCache.get as jest.Mock).mockReturnValue({
    name: 'Test Token',
    symbol: 'TEST',
    decimals: 18,
    totalSupply: '1000000000000000000000000'
  });
  
  // Mock the contract to return zero balance
  mockContract.balanceOf.mockResolvedValue(ethers.parseUnits('0', 18));

  const result = await erc20.getBalance(
    mockEthersService,
    TEST_TOKEN_ADDRESS,
    TEST_OWNER_ADDRESS
  );

  expect(result).toEqual('0.0');
  expect(mockEthersService.getProvider).toHaveBeenCalled();
  expect(mockContract.balanceOf).toHaveBeenCalledWith(TEST_OWNER_ADDRESS);
  expect(balanceCache.set).toHaveBeenCalledWith(
    expect.any(String),
    '0.0',
    { ttl: 30000 }
  );
}); 