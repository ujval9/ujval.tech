import React, { useState } from "react";
import "./About.css";

const About = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: false,
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulate form submission
    try {
      console.log('Form submitted:', formData);
      
      // Reset form and show success message
      setFormData({ name: '', email: '', message: '' });
      setFormStatus({
        submitted: true,
        error: false,
        message: 'Thank you for your message! I will get back to you soon.'
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setFormStatus({
          submitted: false,
          error: false,
          message: ''
        });
      }, 5000);
    } catch (error) {
      setFormStatus({
        submitted: false,
        error: true,
        message: 'Something went wrong. Please try again later.'
      });
    }
  };

  return (
    <div className="about-container">
      <div className="about-header">
        <h2>About Me</h2>
      </div>
      
      <div className="about-intro">
        <p>I am an experienced iOS and Flutter developer with a proven track record in mobile application development. Currently serving as an Assistant Manager at Jio Platforms Limited, I specialize in creating innovative mobile solutions with a focus on user experience and technical excellence. With a background in Computer Engineering and extensive experience across multiple platforms, I bring a comprehensive understanding of mobile development lifecycles and best practices.</p>
        
        <div className="social-links">
          <a href="https://in.linkedin.com/in/ujval-shah" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://github.com/ujval9" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
      
      <div className="section">
        <h3>Skills</h3>
        <div className="skills-list">
          <div className="skill-category">
            <h4>Technical Skills</h4>
            <ul className="skill-list">
              <li>Programming Languages: Swift, Python, SwiftUI, Flutter, Dart, HTML5, CSS, SQL, C, MATLAB</li>
              <li>Development Tools: Xcode, Figma, AWS, Postman, GitHub, Jira, Azure</li>
              <li>Engineering Concepts: Data Structures, DBMS, OOP, Computer Networks, System Programming, Cloud Computing</li>
            </ul>
          </div>
          <div className="skill-category">
            <h4>Soft Skills</h4>
            <ul className="skill-list">
              <li>Software Development Life Cycle</li>
              <li>Agile Methodology</li>
              <li>IT Product Management</li>
              <li>Design Thinking</li>
              <li>UI/UX Design</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="section">
        <h3>Experience</h3>
        <div className="experience-item">
          <h4>Assistant Manager - Jio Platforms Limited</h4>
          <div className="experience-date">January 2024 - Present</div>
          <ul>
            <li>Perform user testing and bug fixes for multiple Jio apps including Jio Saavn, Jio Photos, and JioTV XR</li>
            <li>Develop internal company management iOS apps using Swift and SwiftUI</li>
            <li>Collaborate with cross-functional teams and provide user experience insights</li>
          </ul>
        </div>
        
        <div className="experience-item">
          <h4>iOS Consultant - Navkarsafal</h4>
          <div className="experience-date">May 2023 - October 2023</div>
          <ul>
            <li>Provided guidance in design and architecture for iOS development team</li>
            <li>Created comprehensive documentation including architecture diagrams and coding guidelines</li>
          </ul>
        </div>
        
        <div className="experience-item">
          <h4>iOS Developer - UiWorks.io</h4>
          <div className="experience-date">September 2022 - December 2022</div>
          <ul>
            <li>Developed new features and improved existing codebase</li>
            <li>Built applications with localization and dark mode support</li>
          </ul>
        </div>
      </div>
      
      <div className="section">
        <h3>Projects</h3>
        <div className="project-item">
          <h4>Carpooler (2024 - Present)</h4>
          <p>A mobile platform designed to facilitate carpooling for corporate employees, offering ride-sharing options to reduce costs and improve commuting convenience.</p>
          <ul>
            <li>Developed core frontend screens: login, sign-up, rider, carpooler, and profile pages</li>
            <li>Conducted user interviews and created user flows, empathy maps, and pain point analysis</li>
            <li>Finalized high-fidelity UI/UX designs and outlined MVP features</li>
          </ul>
          <div className="project-links">
            <a href="https://github.com/ujval9/Carpooler" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
          </div>
        </div>
        
        <div className="project-item">
          <h4>Haptic Braille (2023)</h4>
          <p>An innovative app developed for Swift Student Challenge 2023 that teaches Braille using sounds and haptic feedback.</p>
          <ul>
            <li>Recognized and acknowledged by Apple CEO Tim Cook</li>
            <li>Implemented using Core Haptics, Custom AHAP files, AvFoundation, and SwiftUI</li>
            <li>Created an accessible learning experience for visually impaired users</li>
          </ul>
          <div className="project-links">
            <a href="https://youtu.be/jIOkX2LggAU?si=wLrRUwCCeI2Lvnxi" target="_blank" rel="noopener noreferrer">View Demo</a>
          </div>
        </div>
        
        <div className="project-item">
          <h4>Online Delivery System (2022)</h4>
          <p>A peer-to-peer delivery application developed using Flutter, Dart, and Laravel.</p>
          <div className="project-links">
            <a href="https://github.com/ujval9/Conversions-App" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
          </div>
        </div>
        
        <div className="project-item">
          <h4>Conversion App (2022)</h4>
          <p>A Swift-based application for unit conversions, demonstrating iOS development best practices.</p>
          <div className="project-links">
            <a href="https://github.com/ujval9/Conversions-App" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
          </div>
        </div>
      </div>
      
      <div className="section">
        <h3>Education</h3>
        <div className="education-item">
          <h4>BTech, Computer Engineering</h4>
          <p>Mukesh Patel School of Technology Management & Engineering (MPSTME)</p>
          <p>Narsee Monjee Institute of Management Studies (NMIMS), Mumbai, India</p>
          <div className="education-date">2020-2023 | CGPA: 3.36/4</div>
        </div>
        
        <div className="education-item">
          <h4>Diploma, Computer Engineering</h4>
          <p>Mukesh Patel School of Technology Management & Engineering (MPSTME)</p>
          <div className="education-date">2017-2020 | CGPA: 2.62/4</div>
        </div>
      </div>
      
      <div className="section">
        <h3>Contact</h3>
        <div className="contact-info">
          <p>LinkedIn: <a href="https://in.linkedin.com/in/ujval-shah" target="_blank" rel="noopener noreferrer">linkedin.com/in/ujval-shah</a></p>
          <p>GitHub: <a href="https://github.com/ujval9" target="_blank" rel="noopener noreferrer">github.com/ujval9</a></p>
        </div>
        
        <div className="contact-form">
          {formStatus.message && (
            <div className={`form-message ${formStatus.error ? 'error' : 'success'}`}>
              {formStatus.message}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message:</label>
              <textarea 
                id="message" 
                name="message" 
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <button type="submit" className="submit-button">Send Message</button>
          </form>
        </div>
      </div>
      
      <div className="footer-info">
        <p>&copy; 2024 Ujval Shah. All rights reserved.</p>
        <p>Languages: English, Hindi, Gujarati</p>
        <p>Location: Mumbai, India</p>
      </div>
    </div>
  );
};

export default About;