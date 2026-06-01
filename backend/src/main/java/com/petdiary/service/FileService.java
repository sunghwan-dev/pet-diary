package com.petdiary.service;

import com.petdiary.exception.CustomException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileService {

    private final Path uploadLocation;

    public FileService(@Value("${app.upload.dir}") String uploadDir) {
        this.uploadLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadLocation);
        } catch (IOException e) {
            throw new CustomException("Could not create upload directory", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public String storeFile(MultipartFile file) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = "";

        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            extension = originalFileName.substring(i);
        }

        String fileName = UUID.randomUUID().toString() + extension;

        try {
            if (fileName.contains("..")) {
                throw new CustomException("Invalid file path", HttpStatus.BAD_REQUEST);
            }

            Path targetLocation = this.uploadLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return fileName;
        } catch (IOException e) {
            throw new CustomException("Could not store file", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
