import web3
import eth_account
print("web3 version:", web3.__version__)
print("eth_account version:", eth_account.__version__)

from eth_account import Account
acct = Account.create()
print("acct:", acct.address)
