import * as React from 'react'
import Link from 'next/link'

const MemberPage = ({member}) => {
    
    const urlParam = member[0].accountNumber

    const options =
      [
        {value: member[0].cardTier, text: member[0].cardTier },
        {value: 'Red', text: 'Red'},
        {value: 'Blue', text: 'Blue'},
        {value: 'Gold', text: 'Gold'},
        {value: 'Black', text: 'Black'},
        {value: 'None', text:'None'}
      ]
    
    const [selected, setSelected] = React.useState(options[0].value)
    const [newNotes, setNotes] = React.useState(member[0].notes)
    

    const handleTierChange = (event) => {      
        setSelected(event.target.value);
        console.log(selected)
      };

    const handleNotesChange = (event) => {       
        setNotes(event.target.value)
        console.log(newNotes)
    }

      async function handleFormSubmit() {
        const thisUrl = `https://syndicate-member.herokuapp.com/api/update/${urlParam}`

        try{
            console.log(thisUrl)
            await postFormDataAsJson({thisUrl})
            // alert('changes have been saved')
        }catch(error) {
            console.log(error)
        }
    }

        async function postFormDataAsJson() {
            const formDataJsonString = JSON.stringify({
                shopifyCustomerId: member[0].shopifyCustomerId,
                cardTier: selected,
                notes: newNotes
            });
            const fetchOptions = {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: formDataJsonString,
            };
            const response = await fetch(`https://syndicate-member.herokuapp.com/api/update/${member[0].accountNumber}`, fetchOptions);

            if (!response.ok) {
                console.log('error in fetch')
                const errorMessage = await response.text();
                throw new Error(errorMessage);
            }
            alert("your changes have been saved")             
            return response.json()
        }
    return(
    
        member.map(({customerEmail, cardTier, accountNumber, notes}) => (
            <>
                <Link href={`/`}>
                <button className="backButton">Back</button>
                </Link>
                <div className="border">
                <p className="memberPageHeader">  
                    <span><span key={customerEmail} className="bold">Customer Email:</span> {customerEmail} </span>
                    <span><span key={accountNumber} className="bold">| Account Number:</span> {accountNumber} </span>
                    <span><span key="cardTier" className="bold">| Current Membership Tier:</span> {cardTier} </span>
                </p>
                </div>   
                <div key="form" className="formDiv">
                    <h3>Edit Member</h3>
                    <form className="memberForm" onSubmit={() => handleFormSubmit()}> 
                        <label>
                            Membership Tier:  
                            <select name="tierSelect" className="tierSelect" value={selected} onChange={handleTierChange}>
                                {options.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.text}
                                    </option>
                                ))}
                            </select>
                        </label> <br></br>
                        <label>Member Notes: <br></br>
                            <textarea name="memberNotes" className="notesTa"  value={newNotes} onChange={handleNotesChange}></textarea>
                        </label>
                        <input type="submit" value="Save Changes"></input>
                    </form>        
                </div>                     
            </>      
        )))       
}

export async function getServerSideProps(props){

    const response = await fetch(`https://syndicate-member.herokuapp.com/api/member/${props.query.memberNum}`)
    const data = await response.json()

    return {
        props: {
            member: data
        }
    }
}


export default MemberPage