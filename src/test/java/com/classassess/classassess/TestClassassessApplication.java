package com.classassess.classassess;

import org.springframework.boot.SpringApplication;

public class TestClassassessApplication {

    public static void main(String[] args) {
        SpringApplication.from(ClassassessApplication::main).with(TestcontainersConfiguration.class).run(args);
    }

}
