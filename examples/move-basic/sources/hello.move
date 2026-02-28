module move_basic::hello {
    public entry fun ping(account: &signer) {
        let _address = signer::address_of(account);
    }
}
