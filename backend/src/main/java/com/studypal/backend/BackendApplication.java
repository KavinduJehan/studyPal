package com.studypal.backend;

import com.mongodb.client.model.IndexOptions;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.beans.factory.annotation.Autowired;

@SpringBootApplication
public class BackendApplication {

	@Autowired
	private MongoTemplate mongoTemplate;

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@EventListener(ApplicationReadyEvent.class)
	public void initIndexes() {
		// ensure index on userId
		mongoTemplate.indexOps("tasks").ensureIndex(new Index().on("userId", org.springframework.data.domain.Sort.Direction.ASC));
		// ensure compound index on userId and status
		mongoTemplate.indexOps("tasks").ensureIndex(new Index().on("userId", org.springframework.data.domain.Sort.Direction.ASC).on("status", org.springframework.data.domain.Sort.Direction.ASC));
		// ensure index on deadline
		mongoTemplate.indexOps("tasks").ensureIndex(new Index().on("deadline", org.springframework.data.domain.Sort.Direction.ASC));
	}

}
