package com.banking.Bank.service;

import com.banking.Bank.entity.Accounts;

import java.util.List;

public interface AccountService {

    Accounts createAccount(Accounts account);

    List<Accounts> getAllAccounts();

    Accounts getAccountById(Long id);

    Accounts deposit(Long id,double amount);

    Accounts withdraw(Long id,double amount);

    void deleteAccount(Long id);

}