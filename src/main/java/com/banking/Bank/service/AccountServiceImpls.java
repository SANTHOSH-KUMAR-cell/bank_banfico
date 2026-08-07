package com.banking.Bank.service;

import com.banking.Bank.entity.Accounts;
import com.banking.Bank.repository.Accountrepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccountServiceImpls implements AccountService {

    private final Accountrepository repository;

    public AccountServiceImpls(Accountrepository repository) {
        this.repository = repository;
    }

    @Override
    public Accounts createAccount(Accounts account) {
        return repository.save(account);
    }

    @Override
    public List<Accounts> getAllAccounts() {
        return repository.findAll();
    }

    @Override
    public Accounts getAccountById(Long id) {
        return repository.findById(id).orElseThrow();
    }

    @Override
    public Accounts deposit(Long id, double amount) {

        Accounts account = repository.findById(id).orElseThrow();

        account.setBalance(account.getBalance()+amount);

        return repository.save(account);
    }

    @Override
    public Accounts withdraw(Long id, double amount) {

        Accounts account = repository.findById(id).orElseThrow();

        if(account.getBalance()<amount){
            throw new RuntimeException("Insufficient Balance");
        }

        account.setBalance(account.getBalance()-amount);

        return repository.save(account);
    }

    @Override
    public void deleteAccount(Long id) {

        repository.deleteById(id);

    }
}