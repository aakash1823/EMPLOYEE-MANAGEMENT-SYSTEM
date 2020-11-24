const config = require("./config.json");
var express = require("express");
var app = express();
const AWS = require('aws-sdk');
var sql = require("mysql");

AWS.config.update({
    accessKeyId: 'ASIAQISQ55LPBQ4L5A5M',
	secretAccessKey: 'ZRoyMtdtc+Viz876fslbhDZfo7P1A/rhTHqyGLhp',
	sessionToken: 'FwoGZXIvYXdzENv//////////wEaDPHmGx7Z2qGu5ZEi7CLWAb/OHCMV5RGKPQMBMyQy78Iw4GYImpawFTsjtk4C3aQgCl5Bw4pv4j/oz+deZQJ03PTiZg0muLHDX8WMu8j3IxQZE49kex3u03iKlssAiWd9NFiSHyRqDCB3M+o+WHNM34ttLvi6FfecWDeBLdiESntnP7jQLeDyWB/5NLwiPXsN3FM4LyhnGyLAjo6GvWU6kX6MRfjc+z02X19TIJgawkFAOdgwOM/6B76qQMwqRozTjUk+EEEC+4/CGI8+OrXp4evvKXmjdXOdiQuL5/MZc5I80GXdiicol9jT/QUyLVe475wTpyaEmjTr8JljRmmQpb9uZ82xUL0F30a2vt/rm0Gn7cvIm6S/v5JCmA==',
	region: 'us-east-1' 
   });
const multer = require('multer');
var upload = multer({ storage: multer.memoryStorage() });
var s3bucket = new AWS.S3();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views'));

app.set('view engine', 'ejs');
var sqlConnection = sql.createConnection({
    host: "localhost",
    user: "root",
    port: "3306",
    password: "root",
    database: "employee_management_sys",
    multipleStatements: true
});
sqlConnection.connect(function(err) {
    if (!err) {
        console.log("Connected to SQL");
    } else {
        console.log("Connection Failed" + err);
    }
});
app.post("/login", async function(req, res) {
    var username = req.body.username;
    var password = req.body.pass;
    if(password===config.adminpassword){
        res.render("FirstPage.ejs")
    }
})
app.post("/add/employee", upload.single('image'), async function(req, res) {
    var {Employee_id,name,Dept, DOB, Gender,Email, Address,Pnumber , Salary, image}=req.body
    console.log(image);
    var emp_img = req.file.buffer.toString('base64');
    emp_img = Buffer.from(emp_img.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    var image="https://aakashbucket.s3.amazonaws.com/"+name+".jpg";
    await sqlConnection.query("INSERT into employee set ?", { Employee_id,name,Dept, DOB, Gender,Email, Address,Pnumber , Salary,image} , async function(err, results) {
        if (err) {
            console.log(err);
        } else {
            try {
                sqlConnection.query('select * from employee', function (error, results, fields) {
                    if (error) throw error;
                    console.log(results);
                    var a="Employee Added"
                    res.render("resp.ejs",{a})
                  }) 
            } catch (error) {
                console.log(error);
            }
            
        }
        var params = {
            Bucket: 'aakashbucket',
            Key: `${name}.jpg`,
            Body: emp_img,
            ContentEncoding: 'base64',
            ContentType: 'image/jpeg',
            ACL: 'public-read'
            };
        s3bucket.putObject(params, function (err, data) {
            if (err) {
            return console.log("Error storing picture");
            }
            else {
            return console.log("Successfully stored!");
            }
        });
           
    })

});
app.get('/AllEmp', function(req, res){
    try {
               
        sqlConnection.query('select * from employee', function (error, results, fields) {
            if (error) throw error;
            console.log("hi")
            console.log(results);
            res.render("All_Employee",{employees:results});
        })
    } catch (error) {
        console.log(error);
    }
  });
app.get('/EditEmp',function(req,res){
    res.render('Edit_employee.ejs')
})
app.post("/edit/employee", async function(req, res) {
    var {Employee_id,name,Dept, DOB, Gender,Email, Address,Pnumber , Salary, image}=req.body
    console.log(image);
    var emp_img = req.file.buffer.toString('base64');
    emp_img = Buffer.from(emp_img.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    var image="https://aakashbucket.s3.amazonaws.com/"+name+".jpg";
    await sqlConnection.query(`UPDATE employee SET ? WHERE Employee_iD ="${Employee_id}"`,{name,Dept, DOB, Gender,Email, Address,Pnumber , Salary, image}, async function(err, results) {
        if (results.length==0) {
        res.send("Employee is not there")
        } else {
            try {
                sqlConnection.query('select * from employee', function (error, results, fields) {
                    if (error) throw error;
                    console.log(results);
                    var a="Employee Edited"
                    res.render("resp.ejs",{a})
                  }) 
            } catch (error) {
                console.log(error);
            }
            
        }
        var params = {
            Bucket: 'aakashbucket',
            Key: `${name}-${Employee_id}.jpg`,
            Body: emp_img,
            ContentEncoding: 'base64',
            ContentType: 'image/jpeg',
            ACL: 'public-read'
            };
        s3bucket.putObject(params, function (err, data) {
            if (err) {
            return console.log("Error storing picture");
            }
            else {
            return console.log("Successfully stored!");
            }
        });
    })

});
app.post("/attendance", async function(req, res){
    var {Employee_id,Attend}=req.body
    var Attendance=Attend;
    await sqlConnection.query("INSERT into attendance set ?", { Employee_id,Attendance }, async function(err, results) {
        if (err) {
            console.log(err);
        } else {
            try {
                sqlConnection.query('select * from attendance', function (error, results, fields) {
                    if (error) throw error;
                    console.log(results);
                    var a="Attendance Added"
                    res.render("resp1.ejs",{a})
                  }) 
            } catch (error) {
                console.log(error);
            }
            
        }
    })
})
app.post("/attendance1", async function(req, res){
    var {Employee_id}=req.body
    try {
               
        sqlConnection.query(`select * from employee where Employee_id="${Employee_id}"`, function (error, results, fields) {
            if (results.length==0){
                var a="Employee is not there"
                res.render("resp.ejs",{a})
            }else{
            console.log("hi")
            console.log(results);
            res.render("Attendance.ejs",{attends:results[0]});
            }
        })
    } catch (error) {
        var a="Employee is not there"
        res.render("resp.ejs",{a})
        console.log(error);
    }
})
app.post("/salary1", async function(req, res){
    var {Employee_id}=req.body
    try {
               
        sqlConnection.query(`select * from employee where Employee_id="${Employee_id}"`, function (error, results, fields) {
            if (results.length==0){
                var a="Employee is not there"
                res.render("resp.ejs",{a})
            }else{
            console.log("hi")
            console.log(results);
        }
            sqlConnection.query(`select count(Employee_id) as total from attendance where Employee_id="${Employee_id}"`, function (error, results1, fields) {
                res.render("salary.ejs",{sal:results[0],tot:results1[0]});
            })
     
        })
    } catch (error) {
        var a="Employee is not there"
        res.render("resp.ejs",{a})
        console.log(error);
    }
})


// app.get('/dash', async function(req,res){
//     sqlConnection.query('select Employee_id,count(Attendance) as Count from attendance group by Employee_id',function(err,results,fields){
//         console.log(results)
//         sqlConnection.query('select count(Employee_id) as Emp_Count from employee',function(err,results1,fields){
//         var em=results1[0]
//         console.log(em)
//         var i;
//         res.render("Dashboard.ejs",{attend:results,count:results1[0]})
//         })
//     })
// })

app.get('/Emp',async function(req,res){
    res.render("Add_Employee.ejs")
})
app.get('/AddEmp', async function(req,res){
    res.render("Add_Employee.ejs")
})
app.get('/AllEmp', async function(req,res){
    res.render("All_Employee.ejs")
})
app.get('/EditEmp', async function(req,res){
    res.render("Edit_Employee.ejs")
})
app.get('/Attend',async function(req,res){
    res.render("Attendance1.ejs")
})
app.get('/Sal',async function(req,res){
    res.render("Salary1.ejs")
})
app.get('/LOGIN',async function(req,res){
    const path = require('path');
    res.sendFile(path.join(__dirname,'views/index1.html'));
})
app.get('/RemEmp',async function(req,res){
    res.render("Remove_Employee.ejs")
})

app.post('/Remove/employee',async function(req,res){
    
    var {Employee_id}=req.body;
    console.log(Employee_id)
    console.log(`delete from employee where Employee_id="${Employee_id}"`)
    sqlConnection.query(`select * from employee where Employee_id='${Employee_id}'`,function(err,results,fields){
        if(results.length==0){
            var a="Employee is not there"
            res.render("resp.ejs",{a})
        }else{
            sqlConnection.query(`delete from attendance where Employee_id="${Employee_id}"`,function(err,results,fields){
        
                sqlConnection.query(`delete from employee where Employee_id="${Employee_id}"`,function(err,results,fields){
                    var a="Employee Deleted"
                    res.render("resp.ejs",{a})                
            })
            
        })
        }
    })

    
})
app.post('/Back',async function(req,res){
    sqlConnection.query('select * from employee', function (error, results, fields) {
        if (error) throw error;
        console.log("hi")
        console.log(results);
        res.render("All_Employee",{employees:results});
    })
})

app.listen(8080, function() {
    console.log("Server Running at 8080");
})

