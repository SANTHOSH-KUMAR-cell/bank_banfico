package com.banking.Bank.controller;

import com.banking.Bank.entity.Accounts;
import com.banking.Bank.service.AccountService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/accounts")
public class AccountCon {

    private final AccountService service;

    public AccountCon(AccountService service) {
        this.service = service;
    }

    @PostMapping
    public Accounts createAccount(@RequestBody Accounts account){
        return service.createAccount(account);
    }

    @GetMapping
    public List<Accounts> getAllAccounts(){
        return service.getAllAccounts();
    }

    @GetMapping("/{id}")
    public Accounts getAccount(@PathVariable Long id){
        return service.getAccountById(id);
    }

    @PutMapping("/{id}/deposit/{amount}")
    public Accounts deposit(@PathVariable Long id,
                           @PathVariable double amount){

        return service.deposit(id,amount);
    }

    @PutMapping("/{id}/withdraw/{amount}")
    public Accounts withdraw(@PathVariable Long id,
                            @PathVariable double amount){

        return service.withdraw(id,amount);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id){

        service.deleteAccount(id);

        return "Account Deleted Successfully";
    }
}