export type Link = {
  title: string;
  url: string;
};

export type CardData = {
  name: string;        
  title: string;       
  phone: string;       
  email: string;       
  bio?: string;        
  address?: string;    
  socials?: Social[];
  links?: Link[];      
  profilePic?: string; 
  template: string;
};

export type Social = {
  url: string;
  platform: string; 
};